function addToCart(req, res) {
  const { productId, quantity } = req.body;

  if (productId && quantity) {
    res.status(200).json({ message: 'Produk berhasil ditambahkan ke keranjang.' });
  } else {
    res.status(400).json({ message: 'Gagal menambahkan produk: productId atau quantity tidak ditemukan.' });
  }
}

module.exports = { addToCart };
