require('dotenv').config();
const app = require('./app');

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
