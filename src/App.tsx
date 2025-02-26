import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Settings, LogOut, Plus, Trash2, Edit, Lock } from 'lucide-react';
import { db } from './firebase';
import { ref, onValue, push, remove, update, set } from 'firebase/database';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}





function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Load cart from localStorage when the page loads
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // ✅ Store cart in localStorage when cart updates
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

const addToCart = (product: Product) => {
  setCart((currentCart) => {
    const existingItem = currentCart.find(item => item.id === product.id);
    if (existingItem) {
      return currentCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }
    return [...currentCart, { ...product, quantity: 1 }];
  });
};



  const removeFromCart = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // ✅ Checkout function (only handles redirection)
  const handleCheckout = () => {
    localStorage.setItem("cart", JSON.stringify(cart)); // Save before redirecting
    window.location.href = ".././checkout.html";
  };
}






  
  // The admin password - in a real app, this would be handled securely on the server
  const ADMIN_PASSWORD = 'foking123';

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    image: ''
  });






  




  
useEffect(() => {
  const productsRef = ref(db, "products");

  const unsubscribe = onValue(
    productsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
      const productsArray = Object.entries(data).map(([id, product]) => ({
  id,
  ...(typeof product === "object" ? (product as Omit<Product, "id">) : {}),
}));

        
        setProducts(productsArray);
      } else {
        setProducts([]); // ✅ Important: Set empty array if no data
      }
      setIsLoading(false);
    },
    (error) => {
      console.error("Firebase Error:", error);
      alert("Failed to fetch data. Check console for details.");
      setIsLoading(false);
    }
  );

  return () => unsubscribe();
}, []);

  

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleAdminClick = () => {
    if (!isAdmin) {
      setShowLoginModal(true);
    } else {
      setIsAdmin(false);
    }
  };

  const addTo = (product: Product) => {
    set(current => {
      const existingItem = current.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };





const removeFromCart = (productId: string) => {
  console.log("Removing product:", productId);
};

const updateQuantity = (productId: string, newQuantity: number) => {
  console.log("Updating quantity:", productId, newQuantity);
};






  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.description || !newProduct.image) return;
    
    try {
      const productsRef = ref(db, 'products');
      const newProductRef = push(productsRef);
      await set(newProductRef, {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        image: newProduct.image
      });
      
      setNewProduct({ name: '', price: 0, description: '', image: '' });
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const productRef = ref(db, `products/${productId}`);
      await remove(productRef);
      setCart(cart.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
  };

  const saveEdit = async () => {
    if (!editingProduct) return;
    
    try {
      const productRef = ref(db, `products/${editingProduct.id}`);
      await update(productRef, {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        image: newProduct.image
      });
      
      setEditingProduct(null);
      setNewProduct({ name: '', price: 0, description: '', image: '' });
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold">Admin Login</h2>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  loginError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {loginError && (
                <p className="text-red-500 text-sm">Incorrect password</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Doro-suop</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleAdminClick}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                {isAdmin ? <LogOut className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shopping Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Shopping Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-gray-600">{item.price} TK</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-200 rounded"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span></span>
                    <span>{cartTotal.toFixed(2)} TK</span>
                  </div>
                  
                 <button onClick={() => { localStorage.setItem("cart", JSON.stringify(cart)); // Save cart in localStorage
    window.location.href = ".././checkout.html"; // Redirect to checkout page
  }} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Checkout</button>

                  
                </div>
              </>
            )}
          </div>
        )}

        {/* Admin Panel */}
        {isAdmin ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Admin Panel</h2>
            <div className="grid gap-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newProduct.image}
                  onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={editingProduct ? saveEdit : addProduct}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  {editingProduct ? (
                    <>
                      <Edit className="w-5 h-5" />
                      Update Product
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Product
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Product List</h3>
                <div className="grid gap-4">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-gray-600">{product.price} TK</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(product)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Store Front */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{product.price} TK</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
