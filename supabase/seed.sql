-- ============================================================================
-- ROLine V0 - Seed Data
-- 69 Wilayas (updated Nov 2025) + Categories
-- ============================================================================

-- WILAYAS (69 total as of November 2025)
INSERT INTO wilayas (id, name, name_ar, latitude, longitude) VALUES
(1, 'Adrar', 'أدرار', 27.8742, -0.2939),
(2, 'Chlef', 'الشلف', 36.1647, 1.3317),
(3, 'Laghouat', 'الأغواط', 33.7994, 2.8628),
(4, 'Oum El Bouaghi', 'أم البواقي', 35.8744, 7.1139),
(5, 'Batna', 'باتنة', 35.5500, 6.1667),
(6, 'Béjaïa', 'بجاية', 36.7500, 5.0833),
(7, 'Biskra', 'بسكرة', 34.8500, 5.7333),
(8, 'Béchar', 'بشار', 31.6167, -2.2167),
(9, 'Blida', 'البليدة', 36.4667, 2.8333),
(10, 'Bouira', 'البويرة', 36.3833, 3.9000),
(11, 'Tamanrasset', 'تمنراست', 22.7850, 5.5228),
(12, 'Tébessa', 'تبسة', 35.4000, 8.1167),
(13, 'Tlemcen', 'تلمسان', 34.8833, -1.3167),
(14, 'Tiaret', 'تيارت', 35.3667, 1.3167),
(15, 'Tizi Ouzou', 'تيزي وزو', 36.7167, 4.0500),
(16, 'Alger', 'الجزائر', 36.7525, 3.0420),
(17, 'Djelfa', 'الجلفة', 34.6667, 3.2500),
(18, 'Jijel', 'جيجل', 36.8167, 5.7667),
(19, 'Sétif', 'سطيف', 36.1833, 5.4000),
(20, 'Saïda', 'سعيدة', 34.8333, 0.1500),
(21, 'Skikda', 'سكيكدة', 36.8667, 6.9000),
(22, 'Sidi Bel Abbès', 'سيدي بلعباس', 35.1833, -0.6333),
(23, 'Annaba', 'عنابة', 36.9000, 7.7667),
(24, 'Guelma', 'قالمة', 36.4667, 7.4333),
(25, 'Constantine', 'قسنطينة', 36.3650, 6.6147),
(26, 'Médéa', 'المدية', 36.2667, 2.7500),
(27, 'Mostaganem', 'مستغانم', 35.9333, 0.0833),
(28, 'M''Sila', 'المسيلة', 35.7000, 4.5333),
(29, 'Mascara', 'معسكر', 35.4000, 0.1333),
(30, 'Ouargla', 'ورقلة', 31.9500, 5.3167),
(31, 'Oran', 'وهران', 35.6969, -0.6331),
(32, 'El Bayadh', 'البيض', 33.6833, 1.0167),
(33, 'Illizi', 'إليزي', 26.5000, 8.4667),
(34, 'Bordj Bou Arréridj', 'برج بوعريريج', 36.0667, 4.7667),
(35, 'Boumerdès', 'بومرداس', 36.7500, 3.4667),
(36, 'El Tarf', 'الطارف', 36.7667, 8.3167),
(37, 'Tindouf', 'تندوف', 27.6742, -8.1472),
(38, 'Tissemsilt', 'تيسمسيلت', 35.6000, 1.8000),
(39, 'El Oued', 'الوادي', 33.3667, 6.8667),
(40, 'Khenchela', 'خنشلة', 35.4333, 7.1333),
(41, 'Souk Ahras', 'سوق أهراس', 36.2833, 7.9500),
(42, 'Tipaza', 'تيبازة', 36.5833, 2.4333),
(43, 'Mila', 'ميلة', 36.4500, 6.2667),
(44, 'Aïn Defla', 'عين الدفلى', 36.2500, 1.9667),
(45, 'Naâma', 'النعامة', 33.2667, -0.3167),
(46, 'Aïn Témouchent', 'عين تموشنت', 35.2833, -1.1333),
(47, 'Ghardaïa', 'غرداية', 32.4833, 3.6667),
(48, 'Relizane', 'غليزان', 35.7333, 0.5500),
-- 2019-2022 new wilayas (49-58)
(49, 'Timimoun', 'تيميمون', 29.2639, 0.2408),
(50, 'Bordj Badji Mokhtar', 'برج باجي مختار', 21.3275, 0.9481),
(51, 'Ouled Djellal', 'أولاد جلال', 34.4283, 5.0656),
(52, 'Béni Abbès', 'بني عباس', 30.1322, -2.1661),
(53, 'In Salah', 'عين صالح', 27.1961, 2.4650),
(54, 'In Guezzam', 'عين قزام', 19.5669, 5.7722),
(55, 'Touggourt', 'تقرت', 33.1000, 6.0667),
(56, 'Djanet', 'جانت', 24.5547, 9.4847),
(57, 'El M''Ghair', 'المغير', 33.9500, 5.9167),
(58, 'El Meniaa', 'المنيعة', 30.5833, 2.8833),
-- November 2025 new wilayas (59-69)
(59, 'Aflou', 'أفلو', 34.1128, 2.1025),
(60, 'El Abiodh Sidi Cheikh', 'الأبيض سيدي الشيخ', 32.8922, 0.5481),
(61, 'El Aricha', 'العريشة', 34.2150, -1.2500),
(62, 'El Kantara', 'القنطرة', 35.2167, 5.7000),
(63, 'Barika', 'بريكة', 35.3833, 5.3667),
(64, 'Bou Saâda', 'بوسعادة', 35.2167, 4.1833),
(65, 'Bir El Ater', 'بئر العاتر', 34.7500, 8.0667),
(66, 'Ksar El Boukhari', 'قصر البخاري', 35.8833, 2.7500),
(67, 'Ksar Chellala', 'قصر الشلالة', 35.2167, 2.3167),
(68, 'Aïn Oussara', 'عين وسارة', 35.4500, 2.9000),
(69, 'Messaad', 'مسعد', 34.1667, 3.5000)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- CATEGORIES (Marketplace)
INSERT INTO categories (id, name, name_ar, icon, parent_id, sort_order) VALUES
-- Parent categories
(1, 'Electronics', 'إلكترونيات', 'laptop', NULL, 1),
(2, 'Books & Education', 'كتب وتعليم', 'book-open', NULL, 2),
(3, 'Clothing', 'ملابس', 'shirt', NULL, 3),
(4, 'Services', 'خدمات', 'briefcase', NULL, 4),
(5, 'Food & Drinks', 'طعام ومشروبات', 'utensils', NULL, 5),
(6, 'Sports & Leisure', 'رياضة وترفيه', 'dumbbell', NULL, 6),
-- Electronics subcategories
(11, 'Laptops', 'حواسيب محمولة', 'laptop', 1, 1),
(12, 'Phones', 'هواتف', 'smartphone', 1, 2),
(13, 'Tablets', 'لوحات', 'tablet', 1, 3),
(14, 'Accessories', 'ملحقات', 'headphones', 1, 4),
-- Books subcategories
(21, 'Textbooks', 'كتب دراسية', 'book', 2, 1),
(22, 'Courses', 'دورات', 'graduation-cap', 2, 2),
(23, 'Tutoring', 'دروس خصوصية', 'users', 2, 3),
-- Clothing subcategories
(31, 'Men', 'رجال', 'user', 3, 1),
(32, 'Women', 'نساء', 'user', 3, 2),
(33, 'Shoes', 'أحذية', 'footprints', 3, 3),
-- Services subcategories
(41, 'Transport', 'نقل', 'car', 4, 1),
(42, 'Delivery', 'توصيل', 'package', 4, 2),
(43, 'Repairs', 'إصلاحات', 'wrench', 4, 3),
-- Food subcategories
(51, 'Restaurants', 'مطاعم', 'utensils', 5, 1),
(52, 'Cafes', 'مقاهي', 'coffee', 5, 2),
(53, 'Grocery', 'بقالة', 'shopping-basket', 5, 3),
-- Sports subcategories
(61, 'Equipment', 'معدات', 'dumbbell', 6, 1),
(62, 'Tickets', 'تذاكر', 'ticket', 6, 2)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    icon = EXCLUDED.icon,
    parent_id = EXCLUDED.parent_id,
    sort_order = EXCLUDED.sort_order;

-- Reset sequences to avoid conflicts
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
