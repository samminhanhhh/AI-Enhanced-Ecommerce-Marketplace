import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import SellerOrders from './pages/SellerOrders';
import ShopProfile from './pages/ShopProfile';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Chatbot />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<Products />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/seller-orders" element={<SellerOrders />} />
        <Route path="/shop/:id" element={<ShopProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;