import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSheet from "@/components/CartSheet";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import Components from "@/pages/Components";
import ProductDetail from "@/pages/ProductDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Checkout from "@/pages/Checkout";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";
import { Toaster } from "@/components/ui/sonner";

function Shell() {
  const { pathname } = useLocation();
  const minimal = pathname === "/checkout";
  return (
    <div className="flex flex-col min-h-screen">
      {!minimal && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo/:category" element={<Catalog />} />
          <Route path="/componentes" element={<Components />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </main>
      {!minimal && <Footer />}
      <CartSheet />
      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Shell />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
