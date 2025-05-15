-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 08, 2025 at 11:46 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bbn_web`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`admin_id`, `username`, `password_hash`) VALUES
(2, 'admin1', '$2b$10$BwhlaYDUt5qG96zZXZ2aIuFoEGU.AAaQXpcQhSXFDIBjUMZ8eNYFa'),
(3, 'admin2', '$2b$10$foI77xjB/Jrkq/6/B3NIFugQL3gWnHcsAempk/4v6ErWc3dFYsY7O');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`id`, `user_id`, `order_id`, `message`, `is_read`, `created_at`) VALUES
(24, 2, 5, 'Pesanan #5 Anda sedang dikemas.', 0, '2025-05-08 07:26:28'),
(25, 2, 5, 'Pesanan #5 Anda sedang diantar.', 0, '2025-05-08 07:26:29');

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('pending','processing','shipped','delivered','picked_up') NOT NULL DEFAULT 'pending',
  `total_price` float NOT NULL,
  `method` enum('delivery','pickup') NOT NULL,
  `location` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order`
--

INSERT INTO `order` (`order_id`, `user_id`, `order_date`, `status`, `total_price`, `method`, `location`) VALUES
(2, 2, '2025-05-01 17:00:00', 'picked_up', 32500, 'pickup', 'Ambil di Pabrik'),
(5, 2, '2025-05-08 07:28:03', 'delivered', 103000, 'delivery', 'Jl. Raya Narogong Jl. Raya Bekasi No.25 KM.9, RT.004/RW.004, Bojong Menteng, Kec. Rawalumbu, Kota Bk');

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `subtotal` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_item`
--

INSERT INTO `order_item` (`order_item_id`, `order_id`, `product_id`, `quantity`, `subtotal`) VALUES
(4, 2, 17, 1, 32500),
(7, 5, 1, 1, 103000);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` float NOT NULL,
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
  `message` text NOT NULL,
  `proof_of_payment` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `verified_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `order_id`, `user_id`, `amount`, `status`, `message`, `proof_of_payment`, `created_at`, `verified_at`) VALUES
(2, 2, 2, 32500, 'completed', '', '/uploads/payments/proof-1746142449030.png', '2025-05-08 05:22:28', '2025-05-08 06:48:45'),
(3, 5, 2, 103000, 'completed', '', '/uploads/payments/proof-1746687176884.png', '2025-05-08 06:52:56', '2025-05-08 07:06:20');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `thick` varchar(50) DEFAULT NULL,
  `avg_weight_per_stick` varchar(50) DEFAULT NULL,
  `unit_price` float DEFAULT NULL,
  `stock` int(11) DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `product_name`, `type`, `thick`, `avg_weight_per_stick`, `unit_price`, `stock`) VALUES
(1, 'CNP (Kanal C)', '', '1.00', '± 6.60 – 6.7', 103000, 8),
(2, 'CNP (Kanal C)', '', '1.00 ECO', '± 6.20 – 6.40', 97000, 9),
(3, 'CNP (Kanal C)', '', '0.75', '± 4.96 – 5.10', 75000, 9),
(4, 'CNP (Kanal C)', '', '0.75 ECO', '± 4.71 – 4.85', 72000, 10),
(5, 'CNP (Kanal C)', '', '0.70', '± 4.45 – 4.60', 69500, 10),
(6, 'CNP (Kanal C)', '', '0.65', '± 4.10 – 4.25', 65000, 10),
(7, 'CNP (Kanal C)', '', '0.60', '± 3.75 – 3.85', 61000, 10),
(8, 'CNP (Kanal C)', '75 × 35', '0.55', '± 3.30 – 3.50', 55000, 10),
(9, 'CNP (Kanal C)', '', '0.50', '± 3.05 – 3.20', 51000, 10),
(10, 'CNP (Kanal C)', '', '0.45', '± 2.67 – 2.80', 45000, 10),
(11, 'CNP (Kanal C)', '', '1.00 SNI', '± 7.00', 123000, 10),
(12, 'CNP (Kanal C)', '', '0.75 SNI', '± 5.20', 90000, 10),
(13, 'CNP (Kanal C)', '', '0.70 SNI', '± 4.70', 83500, 10),
(14, 'CNP (Kanal C)', '', '0.65 SNI', '± 4.40', 79000, 10),
(15, 'CNP (Kanal C)', '75 × 35 ', '0.60 SNI', '± 4.00', 77000, 10),
(16, 'CNP (Kanal C)', '', '0.55 SNI', '± 3.70', 73000, 10),
(17, 'Reng', '', '0.45', '± 1.70 – 1.85', 32500, 9),
(18, 'Reng', 'R30', '0.40', '± 1.51 – 1.60', 28500, 10),
(19, 'Reng', '', '0.40 Mini', '± 1.39 – 1.49', 26000, 10),
(20, 'Reng', '', '0.35 Mini', '± 1.17 – 1.25', 23500, 10),
(21, 'Reng', 'R28', '0.30 Mini', '± 1.00 – 1.10', 22500, 10),
(22, 'Reng', 'R30', '0.45 SNI', '± 2.00', 38000, 10),
(23, 'Spandek', '105 & KR95', '0.45 AZ100', '± 3.7 – 3.9', 75000, 10),
(24, 'Spandek', '105 & KR95', '0.45 AZ70', '± 3.7 – 3.9', 73000, 10),
(25, 'Spandek', '105 & KR95', '0.40 AZ100', '± 3.2 – 3.4', 67000, 10),
(26, 'Spandek', '105 & KR95', '0.40 AZ70', '± 3.2 – 3.4', 65000, 10),
(27, 'Spandek', '105 & KR95', '0.35 AZ100', '± 2.7 – 2.9', 61000, 10),
(28, 'Spandek', '105 & KR95', '0.35 AZ70', '± 2.7 – 2.9', 59000, 10),
(29, 'Spandek', '105 & KR95', '0.30 ECO', '± 2.1 – 2.3', 41000, 10),
(30, 'Spandek', '105 & KR95', '0.30 AZ50', '± 2.35 – 2.5', 49500, 10),
(31, 'Spandek', '105 & KR95', '0.30 AZ70', '± 2.35 – 2.5', 51500, 10),
(32, 'Spandek', '105 & KR95', '0.30 AZ100', '± 2.35 – 2.5', 53500, 10),
(33, 'Spandek', '105 & KR95', '0.25', '± 1.75 – 1.9', 39500, 10),
(34, 'Spandek', '105 & KR95', '0.25 ECO', '± 1.55 – 1.7', 31000, 10),
(35, 'Spandek', 'KR 750,770,840 Polos', '0.30', '± 1.7 – 1.9', 40000, 10),
(36, 'Spandek', 'KR 750,770,840 Polos', '0.25', '± 1.3 – 1.5', 35000, 10),
(37, 'Spandek', 'KR 750,770,840 Merah Merapi/Carita', '0.30', '± 1.55 – 1.7', 40000, 10),
(38, 'Spandek', 'KR 750,770,840 Hijau', '0.30', '± 1.55 – 1.7', 40000, 10),
(39, 'Spandek', '750,770,840 Biru Bro', '0.30', '± 1.55 – 1.7', 40000, 10),
(40, 'Spandek', 'Pasir', '0.30', '± 3.3 – 3.5', 61500, 10),
(41, 'Bondek', 'Galvanize Dan Blackresin', '0.55', '± 4.7 – 4.9', 82000, 10),
(42, 'Bondek', 'Galvanize Dan Blackresin', '0.60', '± 5.1 – 5.3', 88000, 10),
(43, 'Bondek', 'Galvanize Dan Blackresin', '0.65', '± 5.6 – 5.8', 95000, 10),
(44, 'Bondek', 'Galvanize Dan Blackresin', '0.70', '± 6.1 – 6.3', 103000, 10),
(45, 'Bondek', 'Galvanize Dan Blackresin', '0.75', '± 6.6 – 6.8', 109000, 10),
(46, 'Bondek', 'Galvalume', '0.55', '± 4.7 – 4.9', 82000, 10),
(47, 'Bondek', 'Galvalume', '0.60', '± 5.1 – 5.3', 88000, 10),
(48, 'Bondek', 'Galvalume', '0.65', '± 5.6 – 5.8', 95000, 10),
(49, 'Bondek', 'Galvalume', '0.70', '± 6.1 – 6.3', 103000, 10),
(50, 'Bondek', 'Galvalume', '0.75', '± 6.6 – 6.8', 109000, 10),
(51, 'Flatseat', 'Roll Sheet', 'T40 × 0.30', '± 0.70 – 0.9', 20000, 10),
(52, 'Flatseat', 'Roll Sheet', 'T60 × 0.30', '± 1.1 – 1.3', 26000, 10),
(53, 'Flatseat', 'Roll Sheet', 'T90 × 0.25', '± 1.3 – 1.5', 35000, 10),
(54, 'Flatseat', 'Roll Sheet', 'T90 × 0.30', '± 1.6 – 1.8', 40000, 10),
(55, 'Flatseat', 'Roll Sheet', 'T120 × 0.25', '± 1.7 – 1.9', 39500, 10),
(56, 'Flatseat', 'Roll Sheet', 'T120 × 0.30 AZ50', '± 2.35 – 2.5', 49500, 10),
(57, 'Flatseat', 'Roll Sheet', 'T120 × 0.30 AZ70', '± 2.35 – 2.5', 51500, 10),
(58, 'Flatseat', 'Roll Sheet', 'T120 × 0.30 AZ100', '± 2.35 – 2.5', 53500, 10),
(59, 'Flatseat', 'Roll Sheet', 'T120 × 0.35 AZ100', '± 2.7 – 2.9', 61000, 10),
(60, 'Flatseat', 'Roll Sheet', 'T120 × 0.35 AZ70', '± 2.7 – 2.9', 59000, 10),
(61, 'Flatseat', 'Roll Sheet', 'T120 × 0.40 AZ100', '± 3.2 – 3.4', 67000, 10),
(62, 'Flatseat', 'Roll Sheet', 'T120 × 0.40 AZ70', '± 3.2 – 3.4', 65000, 10),
(63, 'Flatseat', 'Roll Sheet', 'T120 × 0.45 AZ100', '± 3.7 – 3.9', 75000, 10),
(64, 'Flatseat', 'Roll Sheet', 'T120 × 0.45 AZ70', '± 3.7 – 3.9', 73000, 10),
(65, 'Nok C', 'Polos', '0.20', '± 0.25', 7000, 10),
(66, 'Nok C', 'Pasir', '0.20', '± 0.49', 12000, 10),
(67, 'Hollow', '16 × 32', '', '± 0.50 – 0.57', 13000, 10),
(68, 'Hollow', '32 × 32', '0.25 TCT', '± 0.70 – 0.75', 18000, 10),
(69, 'Hollow', '17 × 35', '', '± 0.68', 14500, 10),
(70, 'Genteng Metal', 'Polos', '2 × 4', '± 1.03 – 1.05', 18500, 10),
(71, 'Genteng Metal', 'Pasir', '2 × 4', '± 1.95 – 2.05', 23500, 10),
(72, 'Genteng Metal', 'Transparan', '2 × 4', '± 0.90', 59000, 10),
(73, 'Talang Juray', 'Polos', '3 M', '± 2.5', 60000, 10),
(74, 'Talang Juray', 'Pasir', '3 M', '', 77000, 10);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `shop_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `shop_name`, `email`, `phone`, `address`, `password_hash`, `created_at`) VALUES
(2, 'Mega Steel Bantar Gebang', 'megasteel@gmail.com', '082186774774', 'Jl. Raya Narogong Jl. Raya Bekasi No.25 KM.9, RT.004/RW.004, Bojong Menteng, Kec. Rawalumbu, Kota Bks, Jawa Barat 17310', '$2b$10$Cj8BI7Y6TKKC/Dg4dEqs..EdEDVDotw00iiJPoyTJmkhNH.mUUrWa', '2025-05-01 23:33:35'),
(3, 'Sumber Baja Jatiasih', 'sumberbaja@gmail.com', '087745319967', 'Jl, Jl. Wibawa Mukti II No.153, RT.002/RW.011, Jatiluhur, Kec. Jatiasih, Kota Bks, Jawa Barat 17425', '$2b$10$Ja9fK.jsABmPribODL5gVOAs7N9Feh57EfDVwd8eRkSouaDZ6BLfi', '2025-05-08 07:38:18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_user` (`user_id`),
  ADD KEY `idx_notification_order` (`order_id`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_order_user` (`user_id`);

--
-- Indexes for table `order_item`
--
ALTER TABLE `order_item`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `idx_order` (`order_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_payment_order` (`order_id`),
  ADD KEY `idx_payment_user` (`user_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `order`
--
ALTER TABLE `order`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_item`
--
ALTER TABLE `order_item`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `fk_notification_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_item`
--
ALTER TABLE `order_item`
  ADD CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_item_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;





