-- Migration: Atomic Order Creation
-- Prevents race condition when multiple users try to order same product

-- Add 'reserved' status to product_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reserved' AND enumtypid = 'product_status'::regtype) THEN
    ALTER TYPE product_status ADD VALUE 'reserved' AFTER 'active';
  END IF;
END $$;

-- Function: Create order atomically with product reservation
-- Uses SELECT FOR UPDATE to lock the product row during transaction
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_buyer_id UUID,
  p_product_id UUID,
  p_payment_method TEXT,
  p_shipping_address TEXT,
  p_shipping_wilaya INT,
  p_buyer_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_order_id UUID;
  v_result JSON;
BEGIN
  -- Lock and fetch product in single operation
  SELECT id, merchant_id, price, status
  INTO v_product
  FROM products
  WHERE id = p_product_id
  FOR UPDATE NOWAIT; -- Fail immediately if locked by another transaction

  -- Check if product exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Produit non trouvé'
    );
  END IF;

  -- Check if product is available (active status)
  IF v_product.status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Produit non disponible'
    );
  END IF;

  -- Check buyer is not the seller
  IF v_product.merchant_id = p_buyer_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas acheter votre propre produit'
    );
  END IF;

  -- Mark product as reserved (prevents other orders)
  UPDATE products
  SET status = 'reserved', updated_at = NOW()
  WHERE id = p_product_id;

  -- Create the order
  INSERT INTO orders (
    buyer_id,
    seller_id,
    product_id,
    status,
    payment_method,
    total_amount,
    shipping_address,
    shipping_wilaya,
    buyer_notes
  ) VALUES (
    p_buyer_id,
    v_product.merchant_id,
    p_product_id,
    'pending',
    p_payment_method,
    v_product.price,
    p_shipping_address,
    p_shipping_wilaya,
    p_buyer_notes
  )
  RETURNING id INTO v_order_id;

  -- Return success with order data
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_product.price,
    'seller_id', v_product.merchant_id
  );

EXCEPTION
  WHEN lock_not_available THEN
    -- Another transaction is processing this product
    RETURN json_build_object(
      'success', false,
      'error', 'Produit en cours de réservation, réessayez'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors de la création de la commande'
    );
END;
$$;

-- Function: Cancel order and release product
CREATE OR REPLACE FUNCTION cancel_order_release_product(
  p_order_id UUID,
  p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order with lock
  SELECT id, buyer_id, seller_id, product_id, status
  INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Commande non trouvée');
  END IF;

  -- Verify user can cancel (buyer or seller)
  IF v_order.buyer_id != p_user_id AND v_order.seller_id != p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  -- Only pending orders can be cancelled
  IF v_order.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Seules les commandes en attente peuvent être annulées');
  END IF;

  -- Cancel order
  UPDATE orders
  SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;

  -- Release product back to active
  UPDATE products
  SET status = 'active', updated_at = NOW()
  WHERE id = v_order.product_id
  AND status = 'reserved';

  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_order_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_order_release_product TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_order_atomic IS 'Atomically creates an order and reserves the product to prevent race conditions';
COMMENT ON FUNCTION cancel_order_release_product IS 'Cancels an order and releases the product back to active status';
