import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Lock,
  Search,
  User,
  LogIn,
} from "lucide-react";
import { db, auth } from "./firebase";
import {
  ref,
  onValue,
  push,
  remove,
  update,
  set,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  chatLink?: string;
  userId: string;
}

interface CartItem extends Product {
  quantity: number;
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // The admin password - in a real app, this would be handled securely on the server
  const ADMIN_PASSWORD = "foking123";

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    description: "",
    image: "",
    chatLink: "",
  });

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        localStorage.removeItem("cart");
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Check if user is admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "admin@doro-suop.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load products from Firebase
  useEffect(() => {
    const productsRef = ref(db, "products");

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const productsArray = Object.entries(data).map(([id, product]) => ({
            id,
            ...(product as Omit<Product, "id">),
          }));
          setProducts(productsArray);
        } else {
          setProducts([]);
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

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle checkout - redirects to the chat link of the first item in cart
  function handleCheckout() {
    if (cart.length > 0 && cart[0].chatLink) {
      window.open(cart[0].chatLink, "_blank");
    } else {
      alert("No chat link available for this product.");
    }
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPassword("");
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

  const handleUserAuth = async () => {
    try {
      setAuthError("");
      if (authMode === "register") {
        await createUserWithEmailAndPassword(auth, email, userPassword);
      } else {
        await signInWithEmailAndPassword(auth, email, userPassword);
      }
      setShowAuthModal(false);
      setEmail("");
      setUserPassword("");
    } catch (error: any) {
      console.error("Authentication error:", error);
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const addProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.description ||
      !newProduct.image
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (!user) {
      alert("You must be logged in to add a product");
      setShowAuthModal(true);
      return;
    }

    try {
      const productsRef = ref(db, "products");
      const newProductRef = push(productsRef);
      await set(newProductRef, {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        image: newProduct.image,
        chatLink: newProduct.chatLink || "",
        userId: user.uid,
      });

      setNewProduct({
        name: "",
        price: 0,
        description: "",
        image: "",
        chatLink: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again.");
    }
  };

  const deleteProduct = async (productId: string, productUserId: string) => {
    // Only admin or the product owner can delete
    if (!user || (user.uid !== productUserId && !isAdmin)) {
      alert("You do not have permission to delete this product");
      return;
    }

    try {
      const productRef = ref(db, `products/${productId}`);
      await remove(productRef);
      setCart(cart.filter((item) => item.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const startEdit = (product: Product) => {
    // Only admin or the product owner can edit
    if (!user || (user.uid !== product.userId && !isAdmin)) {
      alert("You do not have permission to edit this product");
      return;
    }

    setEditingProduct(product);
    setNewProduct(product);
  };

  const saveEdit = async () => {
    if (!editingProduct || !user) return;

    // Only admin or the product owner can edit
    if (user.uid !== editingProduct.userId && !isAdmin) {
      alert("You do not have permission to edit this product");
      return;
    }

    try {
      const productRef = ref(db, `products/${editingProduct.id}`);
      await update(productRef, {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        image: newProduct.image,
        chatLink: newProduct.chatLink || "",
      });

      setEditingProduct(null);
      setNewProduct({
        name: "",
        price: 0,
        description: "",
        image: "",
        chatLink: "",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Login Modal */}
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
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  loginError ? "border-red-500" : "border-gray-300"
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

      {/* User Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold">
                {authMode === "login" ? "Login" : "Register"}
              </h2>
            </div>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAuthError("");
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-300"
              />
              <input
                type="password"
                placeholder="Password"
                value={userPassword}
                onChange={(e) => {
                  setUserPassword(e.target.value);
                  setAuthError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleUserAuth()}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-300"
              />
              {authError && <p className="text-red-500 text-sm">{authError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUserAuth}
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {authMode === "login" ? "Login" : "Register"}
                </button>
              </div>
              <div className="text-center">
                <button
                  onClick={() =>
                    setAuthMode(authMode === "login" ? "register" : "login")
                  }
                  className="text-purple-600 hover:text-purple-800 text-sm"
                >
                  {authMode === "login"
                    ? "Don't have an account? Register"
                    : "Already have an account? Login"}
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
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </button>
              )}
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
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <Settings className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-300"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl p-6 overflow-y-auto z-40">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Shopping Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Your cart is empty
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-gray-600">{item.price} TK</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-2 py-1 bg-gray-200 rounded"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
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
                    <span>Total</span>
                    <span>{cartTotal.toFixed(2)} TK</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mt-4"
                  >
                    Chat with Seller
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Product Form (Available to all logged-in users) */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Add New Product</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={newProduct.image}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, image: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Chat Link (WhatsApp/Instagram/Messenger)"
                value={newProduct.chatLink || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, chatLink: e.target.value })
                }
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
          </div>
        )}





        
       {/* Toggle Button */}
      <button
        onClick={() => setIsSingleColumn(!isSingleColumn)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        {isSingleColumn ? "Show 2 Per Row" : "Show 1 Per Row"}
      </button>

      {/* Product List */}
      <div className={`grid gap-6 
        ${isSingleColumn ? "grid-cols-1" : "grid-cols-2"}  
        sm:grid-cols-2 lg:grid-cols-3`}
      >
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col">
            <div className="flex justify-center mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
            </div>
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-500 text-sm my-2">{product.description}</p>
            <div className="mt-auto pt-4 flex items-center justify-between">
              <span className="text-xl font-bold">{product.price} TK</span>
              <div className="flex gap-2">
                {user && (user.uid === product.userId || isAdmin) && (
                  <>
                    <button
                      onClick={() => startEdit(product)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id, product.userId)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
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



        
      </main>
    </div>
  );
}

export default App;
