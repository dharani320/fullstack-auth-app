import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import "./App.kubaran.css";
import anchovyImage from "./assets/anchovy.png";
import dryFishImage from "./assets/dryfish.png";
import prawnsImage from "./assets/prawns.png";
import heroImage from "./assets/kubaran-hero(1).png";

const API_URL = "https://fullstack-auth-app-74ca.onrender.com";


const trackingStatuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
];

const getStatusIndex = (status) => {
  return trackingStatuses.indexOf(status);
};

const loadLeaflet = () => {
  if (window.L) return Promise.resolve(window.L);

  if (!document.getElementById("leaflet-map-css")) {
    const stylesheet = document.createElement("link");
    stylesheet.id = "leaflet-map-css";
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    stylesheet.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    stylesheet.crossOrigin = "";
    document.head.appendChild(stylesheet);
  }

  return new Promise((resolve, reject) => {
    let script = document.getElementById("leaflet-map-script");
    const handleLoad = () => window.L ? resolve(window.L) : reject(new Error("Map library did not load."));
    const handleError = () => reject(new Error("Map library could not be loaded."));

    if (!script) {
      script = document.createElement("script");
      script.id = "leaflet-map-script";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });
      document.head.appendChild(script);
      return;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });
};

function DeliveryMap({ pin, onPinSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const callbackRef = useRef(onPinSelect);
  const pinRef = useRef(pin);
  const [status, setStatus] = useState("Loading map...");

  callbackRef.current = onPinSelect;
  pinRef.current = pin;

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current).setView([11.0168, 76.9558], 13);
        mapRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
        }).addTo(map);

        const placePin = (location, notify = true) => {
          const coordinates = [location.lat, location.lng];
          if (!markerRef.current) {
            markerRef.current = L.marker(coordinates, { draggable: true }).addTo(map);
            markerRef.current.on("dragend", () => {
              const point = markerRef.current.getLatLng();
              callbackRef.current({ latitude: point.lat, longitude: point.lng });
            });
          } else {
            markerRef.current.setLatLng(coordinates);
          }
          if (notify) {
            callbackRef.current({ latitude: location.lat, longitude: location.lng });
          }
        };

        map.on("click", (event) => placePin(event.latlng));
        mapRef.current.placePin = (location) => placePin(location, false);
        setStatus("Click the map to drop a pin, or drag the pin to adjust it.");

        if (pinRef.current) {
          placePin({ lat: pinRef.current.latitude, lng: pinRef.current.longitude }, false);
          map.setView([pinRef.current.latitude, pinRef.current.longitude], 16);
        }
      } catch {
        if (!cancelled) setStatus("The map could not load. You can still enter your address manually.");
      }
    };

    initializeMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!pin || !mapRef.current?.placePin) return;
    mapRef.current.placePin({ lat: pin.latitude, lng: pin.longitude });
    mapRef.current.setView([pin.latitude, pin.longitude], 16);
  }, [pin]);

  return (
    <>
      <div className="delivery-address-map" ref={containerRef} aria-label="Interactive delivery map" />
      <p className="leaflet-map-status" role="status">{status}</p>
    </>
  );
}

function App() {
 
useEffect(() => {
  const dividers = document.querySelectorAll(
    ".kubaran-quality .quality-grid article"
  );

  let ticking = false;

  const updateDividers = () => {
    const viewportHeight = window.innerHeight;

    dividers.forEach((article) => {
      const rect = article.getBoundingClientRect();

      const progress = Math.max(
        0,
        Math.min(
          1,
         ((viewportHeight - rect.top) /
  (viewportHeight + rect.height)) * 2
        )
      );

      article.style.setProperty(
        "--divider-progress",
        progress
      );
    });

    ticking = false;
  };

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateDividers);
      ticking = true;
    }
  };

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });
  window.addEventListener("resize", handleScroll);

  updateDividers();

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleScroll);
  };
}, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ==========================================
  // PRODUCTS
  // ==========================================

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ==========================================
  // CUSTOMER STATE
  // ==========================================

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);

  const [loggedUser, setLoggedUser] = useState(null);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    city: "",
    pinCode: "",
  });
  const [addressType, setAddressType] = useState("Home");
  const [mapPin, setMapPin] = useState(null);
  const [mapMessage, setMapMessage] = useState("Click the map to choose your delivery pin.");
  const geocodeRequestSequence = useRef(0);

  const [placing, setPlacing] = useState(false);

  // ==========================================
  // CUSTOMER ORDERS
  // ==========================================

  const [myOrders, setMyOrders] = useState([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderDateFilter, setOrderDateFilter] = useState("");

  // ==========================================
  // ADMIN STATE
  // ==========================================

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const [adminLogin, setAdminLogin] = useState({
    username: "",
    password: "",
  });

  const [adminOrders, setAdminOrders] = useState([]);
  const [savingDeliveryId, setSavingDeliveryId] = useState(null);

  // ==========================================
  // ADMIN CUSTOMER STATE
  // ==========================================

  const [adminCustomers, setAdminCustomers] = useState([]);
  const [loadingAdminCustomers, setLoadingAdminCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedAdminCustomer, setSelectedAdminCustomer] = useState(null);

  // ==========================================
  // PRODUCT ADMIN STATE
  // ==========================================

  const [showProductForm, setShowProductForm] = useState(false);

  const [editingProductId, setEditingProductId] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    weight: "",
    emoji: "🐟",
    stock: "",
  });

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const response = await fetch(
        `${API_URL}/products`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load products"
        );
      }

      setProducts(data);
    } catch (error) {
      console.error("PRODUCT LOAD ERROR:", error);

      alert(
        "Could not load products. Please make sure the backend is running."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ==========================================
  // CART
  // ==========================================

  const getProductEmoji = (product) => {
    const rawEmoji = String(product?.emoji || "").trim();

    // Some older product rows contain "??" instead of the emoji.
    // Use the product name as a safe visual fallback.
    if (rawEmoji && rawEmoji !== "??" && rawEmoji !== "?") {
      return rawEmoji;
    }

    const name = String(product?.name || "").toLowerCase();

    if (name.includes("prawn") || name.includes("shrimp")) {
      return "🦐";
    }

    return "🐟";
  };

  const getStockState = (stock) => {
    const quantity = Number(stock) || 0;

    if (quantity <= 0) {
      return { label: "Out of Stock", className: "out-of-stock" };
    }

    if (quantity <= 5) {
      return { label: `Only ${quantity} left`, className: "low-stock" };
    }

    if (quantity <= 10) {
      return { label: `${quantity} available`, className: "medium-stock" };
    }

    return { label: `${quantity} in stock`, className: "in-stock" };
  };

  const addToCart = (product) => {
    if (Number(product.stock) <= 0) {
      alert("This product is currently out of stock.");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (
          existing.quantity >= Number(product.stock)
        ) {
          alert(
            `Only ${product.stock} item(s) available in stock.`
          );

          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          price: Number(product.price),
          quantity: 1,
        },
      ];
    });

    alert(`${product.name} added to cart`);
  };

  const increaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const product = products.find(
          (product) => product.id === id
        );

        if (
          product &&
          item.quantity >= Number(product.stock)
        ) {
          alert(
            `Only ${product.stock} item(s) available in stock.`
          );

          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  };

  const decreaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== id
      )
    );
  };

  const totalAmount = cart.reduce(
    (total, item) =>
      total +
      Number(item.price) * item.quantity,
    0
  );

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Registration failed"
        );
      }

      alert(
        "Registration successful! Please login."
      );

      setRegisterForm({
        name: "",
        email: "",
        password: "",
      });

      setShowRegister(false);
      setShowLogin(true);
    } catch (error) {
      alert(error.message);
    }
  };

  // ==========================================
  // CUSTOMER LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Login failed"
        );
      }

    setLoggedUser(data.user);
localStorage.setItem(
  "kubaran_user_token",
  data.token
);

      setLoginForm({
        email: "",
        password: "",
      });

      setShowLogin(false);

      alert(
        `Welcome ${data.user.name}!`
      );
    } catch (error) {
      alert(error.message);
    }
  };

  // ==========================================
  // CUSTOMER LOGOUT
  // ==========================================

  const logoutCustomer = () => {
    setLoggedUser(null);
    setMyOrders([]);

    alert(
      "You have been logged out."
    );
  };

  // ==========================================
  // LOAD CUSTOMER ORDERS
  // ==========================================

  const loadMyOrders = async () => {
    if (!loggedUser) {
      return;
    }

    try {
      setLoadingMyOrders(true);
    const token = localStorage.getItem("kubaran_user_token");

const response = await fetch(
  `${API_URL}/orders/user/${loggedUser.id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load your orders"
        );
      }

      setMyOrders(data);
    } catch (error) {
      console.error(
        "MY ORDERS ERROR:",
        error
      );

      alert(error.message);
    } finally {
      setLoadingMyOrders(false);
    }
  };

  const openMyOrders = async () => {
    if (!loggedUser) {
      alert(
        "Please login to view your orders."
      );

      setShowLogin(true);
      return;
    }

    setShowMyOrders(true);

    await loadMyOrders();
  };

  const clearOrderFilters = () => {
    setOrderSearch("");
    setOrderStatusFilter("All");
    setOrderDateFilter("");
  };

  const filteredMyOrders = myOrders.filter((order) => {
    const search = orderSearch.trim().toLowerCase();

    const matchesSearch =
      search === "" ||
      String(order.id).includes(search) ||
      String(order.status || "").toLowerCase().includes(search) ||
      (Array.isArray(order.items) &&
        order.items.some((item) =>
          String(item.name || "").toLowerCase().includes(search)
        ));

    const matchesStatus =
      orderStatusFilter === "All" ||
      order.status === orderStatusFilter;

    const matchesDate =
      orderDateFilter === "" ||
      (order.created_at &&
        new Date(order.created_at).toISOString().slice(0, 10) ===
          orderDateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // ==========================================
  // PRINT ORDER INVOICE
  // ==========================================

  const printOrderInvoice = (order) => {
    const invoiceWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!invoiceWindow) {
      alert("Please allow pop-ups to print the invoice.");
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const items = Array.isArray(order.items)
      ? order.items
      : [];

    const itemRows = items
      .map((item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const subtotal = price * quantity;

        return `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.weight || "-")}</td>
            <td class="right">₹${price.toFixed(2)}</td>
            <td class="center">${quantity}</td>
            <td class="right">₹${subtotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    const createdDate = order.created_at
      ? new Date(order.created_at).toLocaleString()
      : "";

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KUBARAN Invoice - Order #${escapeHtml(order.id)}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, sans-serif;
              color: #222;
              background: #fff;
            }
            .invoice {
              max-width: 850px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #222;
            }
            .brand {
              font-size: 30px;
              font-weight: 800;
              letter-spacing: 2px;
            }
            .muted { color: #666; }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h1 {
              margin: 0 0 6px;
              font-size: 25px;
            }
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin: 25px 0;
            }
            .box {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 16px;
            }
            .box h3 {
              margin: 0 0 10px;
              font-size: 15px;
            }
            .box p {
              margin: 6px 0;
              line-height: 1.45;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              padding: 12px 8px;
              border-bottom: 1px solid #ddd;
              text-align: left;
            }
            th { background: #f5f5f5; }
            .right { text-align: right; }
            .center { text-align: center; }
            .total {
              display: flex;
              justify-content: flex-end;
              margin-top: 18px;
              font-size: 20px;
              font-weight: 700;
            }
            .status {
              margin-top: 18px;
              padding: 10px 14px;
              border: 1px solid #ddd;
              border-radius: 6px;
              display: inline-block;
            }
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 13px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div>
                <div class="brand">KUBARAN</div>
                <div class="muted">Dry Fish & Seafood</div>
              </div>
              <div class="invoice-title">
                <h1>ORDER RECEIPT</h1>
                <div>Order #${escapeHtml(order.id)}</div>
                <div class="muted">${escapeHtml(createdDate)}</div>
              </div>
            </div>

            <div class="details">
              <div class="box">
                <h3>Customer Details</h3>
                <p><strong>Name:</strong> ${escapeHtml(order.customer_name)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(order.phone)}</p>
              </div>

              <div class="box">
                <h3>Delivery Address</h3>
                <p>${escapeHtml(order.address)}</p>
                <p>${escapeHtml(order.city)} - ${escapeHtml(order.pin_code)}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Weight</th>
                  <th class="right">Price</th>
                  <th class="center">Qty</th>
                  <th class="right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div class="total">
              Order Total: ₹${Number(order.total_amount || 0).toFixed(2)}
            </div>

            <div class="status">
              <strong>Order Status:</strong> ${escapeHtml(order.status)}
            </div>

            ${(order.delivery_date || order.tracking_number) ? `
              <div class="status">
                ${order.delivery_date ? `<div><strong>Expected Delivery:</strong> ${escapeHtml(new Date(`${String(order.delivery_date).slice(0, 10)}T00:00:00`).toLocaleDateString())}</div>` : ""}
                ${order.tracking_number ? `<div style="margin-top:6px;"><strong>Tracking Number:</strong> ${escapeHtml(order.tracking_number)}</div>` : ""}
              </div>
            ` : ""}

            <div class="footer">
              Thank you for shopping with KUBARAN!
            </div>
          </div>

          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    invoiceWindow.document.close();
  };

  // ==========================================
  // CHECKOUT
  // ==========================================

  const openCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const unavailableItems = cart.filter((item) => {
      const product = products.find((p) => Number(p.id) === Number(item.id));
      return !product || Number(product.stock) < Number(item.quantity);
    });

    if (unavailableItems.length > 0) {
      alert(
        "Some items in your cart are no longer available in the requested quantity. Please update your cart."
      );
      return;
    }

    if (!loggedUser) {
      alert(
        "Please login before checkout."
      );

      setShowCart(false);
      setShowLogin(true);

      return;
    }

    setCheckoutForm({
      customerName:
        loggedUser.name || "",
      phone: "",
      address: "",
      city: "",
      pinCode: "",
    });
    setAddressType("Home");
    setMapPin(null);
    setMapMessage("Click the map to choose your delivery pin.");

    setShowCart(false);
    setShowCheckout(true);
  };

  const lookupAddressFromCoordinates = async (latitude, longitude) => {
    const requestSequence = ++geocodeRequestSequence.current;
    const token = localStorage.getItem("kubaran_user_token");

    if (!token) {
      setMapMessage("Please sign in again to look up this address.");
      return;
    }

    setMapMessage("Finding the street address, city, and PIN code...");

    try {
      const response = await fetch(
        `${API_URL}/geocode/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not look up this address.");
      }

      if (requestSequence !== geocodeRequestSequence.current) return;

      setCheckoutForm((current) => ({
        ...current,
        address: data.address || current.address,
        city: data.city || current.city,
        pinCode: data.pinCode || current.pinCode,
      }));
      const missingFields = [!data.address, !data.city, !data.pinCode].filter(Boolean).length;
      setMapMessage(
        missingFields === 0
          ? "Address, city, and PIN filled. Review them and add your house or apartment number if needed."
          : "Some address details were found. Please review the fields and fill in anything missing."
      );
    } catch (error) {
      if (requestSequence !== geocodeRequestSequence.current) return;
      setMapMessage(error.message || "Address lookup failed. Please enter the address manually.");
    }
  };

  const previewCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapMessage("Location is not available in this browser. Enter your address manually.");
      return;
    }

    setMapMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pin = { latitude: coords.latitude, longitude: coords.longitude };
        setMapPin(pin);
        lookupAddressFromCoordinates(pin.latitude, pin.longitude);
      },
      () => {
        setMapMessage("Could not access your location. Check browser permission or enter your address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ==========================================
  // PLACE ORDER
  // ==========================================

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!loggedUser) {
      alert(
        "Please login before placing an order."
      );
      return;
    }

    setPlacing(true);

    try {
      const orderData = {
        userId: loggedUser.id,

        customerName:
          checkoutForm.customerName,

        phone:
          checkoutForm.phone,

        address: [
          `${addressType}: ${checkoutForm.address.trim()}`,
          mapPin
            ? `Map pin: ${mapPin.latitude.toFixed(6)}, ${mapPin.longitude.toFixed(6)}`
            : "",
        ].filter(Boolean).join("\n"),

        city:
          checkoutForm.city,

        pinCode:
          checkoutForm.pinCode,

        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          weight: item.weight,
          quantity: item.quantity,
        })),

        totalAmount:
          totalAmount,
      };

      console.log(
        "Sending order to backend:",
        orderData
      );

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        }
      );

      const data =
        await response.json();

      console.log(
        "Backend response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not create order"
        );
      }

      alert(
        `Order placed successfully!\nOrder ID: ${data.order.id}`
      );

      setCart([]);

      setCheckoutForm({
        customerName: "",
        phone: "",
        address: "",
        city: "",
        pinCode: "",
      });

      setShowCheckout(false);

      await loadMyOrders();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setPlacing(false);
    }
  };

// ==========================================
// ADMIN LOGIN
// ==========================================

const handleAdminLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(
      `${API_URL}/admin/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminLogin),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Admin login failed"
      );
    }

    // Save admin authentication token
    localStorage.setItem(
      "kubaran_admin_token",
      data.token
    );

    setShowAdminLogin(false);
    setShowAdmin(true);

    setAdminLogin({
      username: "",
      password: "",
    });

    const loadedOrders =
      await loadAdminOrders();

    await loadProducts();

    await loadAdminCustomers(
      loadedOrders
    );
  } catch (error) {
    alert(error.message);
  }
};

 // ==========================================
// GET ADMIN ORDERS
// ==========================================

const loadAdminOrders = async () => {
  try {
    const adminToken = localStorage.getItem(
      "kubaran_admin_token"
    );

    const response = await fetch(
      `${API_URL}/orders`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not load orders"
      );
    }

    setAdminOrders(data);
    return data;
  } catch (error) {
    console.error(error);
    alert(error.message);
    return [];
  }
};
  // ==========================================
// DELIVERY MANAGEMENT
// ==========================================

const updateDeliveryField = (orderId, field, value) => {
  setAdminOrders((currentOrders) =>
    currentOrders.map((order) =>
      Number(order.id) === Number(orderId)
        ? {
            ...order,
            [field]: value,
          }
        : order
    )
  );
};

const saveDeliveryDetails = async (orderId) => {
  const order = adminOrders.find(
    (item) => Number(item.id) === Number(orderId)
  );

  if (!order) {
    alert("Order not found.");
    return;
  }

  try {
    setSavingDeliveryId(orderId);

    const adminToken = localStorage.getItem(
      "kubaran_admin_token"
    );

    const response = await fetch(
      `${API_URL}/orders/${orderId}/delivery`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          deliveryDate: order.delivery_date
            ? String(order.delivery_date).slice(0, 10)
            : null,
          trackingNumber: order.tracking_number
            ? String(order.tracking_number).trim()
            : null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not update delivery details"
      );
    }

    setAdminOrders((currentOrders) =>
      currentOrders.map((item) =>
        Number(item.id) === Number(orderId)
          ? data.order
          : item
      )
    );

    alert(
      `Delivery details for Order #${orderId} saved successfully.`
    );
  } catch (error) {
    console.error(
      "SAVE DELIVERY ERROR:",
      error
    );

    alert(error.message);
  } finally {
    setSavingDeliveryId(null);
  }
};
  // ==========================================
  // EXPORT ADMIN CUSTOMERS
  // ==========================================

  const exportAdminCustomers = () => {
    if (!adminCustomers.length) {
      alert("No customers available to export.");
      return;
    }

    const escapeCsv = (value) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      [
        "Customer ID",
        "Customer Name",
        "Email",
        "Number of Orders",
        "Total Spent",
        "Last Order Date",
      ],
      ...adminCustomers.map((customer) => [
        customer.id,
        customer.name || "",
        customer.email || "",
        customer.orderCount || 0,
        Number(customer.totalSpent || 0).toFixed(2),
        customer.lastOrderDate
          ? new Date(customer.lastOrderDate).toLocaleString()
          : "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kubaran-customers-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // GET ADMIN CUSTOMERS
  // ==========================================

 const loadAdminCustomers = async (orders = adminOrders) => {
  try {
    setLoadingAdminCustomers(true);

    const adminToken = localStorage.getItem(
      "kubaran_admin_token"
    );

    const response = await fetch(
      `${API_URL}/users`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load customers"
        );
      }

      // Build customer statistics from registered users + orders.
      // Passwords are never displayed in the admin UI.
      const users = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : [];

      const customers = users.map((user) => {
        const userOrders = orders.filter(
          (order) =>
            Number(order.user_id) === Number(user.id)
        );

        const nonCancelledOrders = userOrders.filter(
          (order) => order.status !== "Cancelled"
        );

        const totalSpent = nonCancelledOrders.reduce(
          (sum, order) =>
            sum + Number(order.total_amount || 0),
          0
        );

        const sortedOrders = [...userOrders].sort(
          (a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
        );

        return {
          ...user,
          orderCount: userOrders.length,
          totalSpent,
          lastOrderDate:
            sortedOrders[0]?.created_at || null,
        };
      });

      // Include customers who have orders but are not returned
      // by the users endpoint, if any historical orders exist.
      const existingUserIds = new Set(
        users.map((user) => Number(user.id))
      );

      const orderOnlyCustomers = orders
        .filter(
          (order) =>
            order.user_id &&
            !existingUserIds.has(Number(order.user_id))
        )
        .reduce((list, order) => {
          const userId = Number(order.user_id);

          if (!list.some((customer) => customer.id === userId)) {
            const userOrders = orders.filter(
              (item) =>
                Number(item.user_id) === userId
            );

            const nonCancelledOrders =
              userOrders.filter(
                (item) =>
                  item.status !== "Cancelled"
              );

            list.push({
              id: userId,
              name: order.customer_name || "Unknown Customer",
              email: "Not available",
              orderCount: userOrders.length,
              totalSpent: nonCancelledOrders.reduce(
                (sum, item) =>
                  sum + Number(item.total_amount || 0),
                0
              ),
              lastOrderDate:
                [...userOrders].sort(
                  (a, b) =>
                    new Date(b.created_at || 0) -
                    new Date(a.created_at || 0)
                )[0]?.created_at || null,
            });
          }

          return list;
        }, []);

      setAdminCustomers([
        ...customers,
        ...orderOnlyCustomers,
      ]);
    } catch (error) {
      console.error(
        "CUSTOMER LOAD ERROR:",
        error
      );
      alert(error.message);
    } finally {
      setLoadingAdminCustomers(false);
    }
  };

  // ==========================================
// UPDATE ORDER STATUS
// ==========================================

const updateOrderStatus = async (
  orderId,
  newStatus
) => {
  try {
    const adminToken = localStorage.getItem(
      "kubaran_admin_token"
    );

    const response = await fetch(
      `${API_URL}/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not update order status"
      );
    }

    const updatedOrders = adminOrders.map((order) =>
      Number(order.id) === Number(orderId)
        ? data.order || {
            ...order,
            status: newStatus,
          }
        : order
    );

    setAdminOrders(updatedOrders);

    await loadAdminCustomers(updatedOrders);

    if (loggedUser) {
      await loadMyOrders();
    }

    alert(
      `Order #${orderId} status updated to ${newStatus}`
    );
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    alert(error.message);
  }
};
  // ==========================================
// CANCEL ORDER
// ==========================================

const cancelOrder = async (orderId) => {
  const confirmed = window.confirm(
    `Are you sure you want to cancel Order #${orderId}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const adminToken = localStorage.getItem(
      "kubaran_admin_token"
    );

    const response = await fetch(
      `${API_URL}/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: "Cancelled",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not cancel order"
      );
    }

    const updatedOrders = adminOrders.map((order) =>
      Number(order.id) === Number(orderId)
        ? data.order || {
            ...order,
            status: "Cancelled",
          }
        : order
    );

    setAdminOrders(updatedOrders);

    // Refresh products because cancelled order stock
    // has been returned by the backend.
    await loadProducts();

    await loadAdminCustomers(
      updatedOrders
    );

    if (loggedUser) {
      await loadMyOrders();
    }

    alert(
      `Order #${orderId} cancelled successfully.`
    );
  } catch (error) {
    console.error(
      "CANCEL ORDER ERROR:",
      error
    );

    alert(error.message);
  }
};

  // ==========================================
  // ADMIN LOGOUT
  // ==========================================

  const logoutAdmin = () => {
    setShowAdmin(false);
    setAdminOrders([]);
    setSavingDeliveryId(null);
    setAdminCustomers([]);
    setCustomerSearch("");
    setSelectedAdminCustomer(null);
    setShowProductForm(false);
    setEditingProductId(null);
  };

  // ==========================================
  // PRODUCT FORM
  // ==========================================

  const resetProductForm = () => {
    setProductForm({
      name: "",
      price: "",
      weight: "",
      emoji: "🐟",
      stock: "",
    });

    setEditingProductId(null);
    setShowProductForm(false);
  };

  const startAddProduct = () => {
    setProductForm({
      name: "",
      price: "",
      weight: "",
      emoji: "🐟",
      stock: "",
    });

    setEditingProductId(null);
    setShowProductForm(true);
  };

  const startEditProduct = (product) => {
    setProductForm({
      name: product.name || "",
      price: product.price || "",
      weight: product.weight || "",
      emoji: getProductEmoji(product),
      stock: product.stock ?? "",
    });

    setEditingProductId(product.id);
    setShowProductForm(true);
  };

  // ==========================================
// SAVE PRODUCT
// ==========================================

const handleSaveProduct = async (e) => {
  e.preventDefault();

  try {
    if (!productForm.name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (
      productForm.price === "" ||
      Number(productForm.price) < 0
    ) {
      alert("Please enter a valid price.");
      return;
    }

    if (
      productForm.stock === "" ||
      Number(productForm.stock) < 0
    ) {
      alert("Please enter a valid stock.");
      return;
    }

    const productData = {
      name: productForm.name,
      price: Number(productForm.price),
      weight: productForm.weight,
      emoji: productForm.emoji,
      stock: Number(productForm.stock),
    };

    const adminToken = localStorage.getItem(
      "kubaran_admin_token"
    );

    let response;

    if (editingProductId) {
      response = await fetch(
        `${API_URL}/products/${editingProductId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(productData),
        }
      );
    } else {
      response = await fetch(
        `${API_URL}/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(productData),
        }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not save product"
      );
    }

    alert(
      editingProductId
        ? "Product updated successfully!"
        : "Product added successfully!"
    );

    resetProductForm();

    await loadProducts();
  } catch (error) {
    console.error(
      "SAVE PRODUCT ERROR:",
      error
    );

    alert(error.message);
  }
};
  // ==========================================
// DELETE PRODUCT
// ==========================================

const deleteProduct = async (productId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const adminToken = localStorage.getItem(
      "kubaran_admin_token"
    );

    const response = await fetch(
      `${API_URL}/products/${productId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not delete product"
      );
    }

    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );

    await loadProducts();

    alert(
      "Product deleted successfully!"
    );
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    alert(error.message);
  }
};
  // ==========================================
  // ADMIN PAGE
  // ==========================================

  if (showAdmin) {
    const dashboardTotalOrders = adminOrders.length;

    const dashboardTotalSales = adminOrders
      .filter((order) => order.status !== "Cancelled")
      .reduce(
        (sum, order) =>
          sum + Number(order.total_amount || 0),
        0
      );

    const dashboardPendingOrders = adminOrders.filter(
      (order) => order.status === "Pending"
    ).length;

    const dashboardConfirmedOrders = adminOrders.filter(
      (order) => order.status === "Confirmed"
    ).length;

    const dashboardShippedOrders = adminOrders.filter(
      (order) => order.status === "Shipped"
    ).length;

    const dashboardDeliveredOrders = adminOrders.filter(
      (order) => order.status === "Delivered"
    ).length;

    const dashboardCancelledOrders = adminOrders.filter(
      (order) => order.status === "Cancelled"
    ).length;

    const dashboardLowStockProducts = products.filter(
      (product) => Number(product.stock || 0) <= 10
    );

    const dashboardRecentOrders = [...adminOrders]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 5);

    return (
      <div className="admin-page">

        <div className="admin-header">

          <div>
            <h1>KUBARAN Admin</h1>
            <p>
              Order & Product Management
            </p>
          </div>

          <div className="admin-header-buttons">

            <button
              onClick={async () => {
                const loadedOrders = await loadAdminOrders();
                await loadProducts();
                await loadAdminCustomers(loadedOrders);
              }}
              className="admin-refresh-button"
            >
              🔄 Refresh
            </button>

            <button
              onClick={logoutAdmin}
              className="admin-logout-button"
            >
              Logout
            </button>

          </div>
        </div>

        <div className="admin-content">

          {/* ================================= */}
          {/* BUSINESS DASHBOARD */}
          {/* ================================= */}

          <div className="admin-section admin-dashboard-section">

            <div className="admin-title-row">

              <div>
                <h2>Business Dashboard</h2>
                <p className="admin-section-subtitle">
                  A quick overview of your KUBARAN store.
                </p>
              </div>

            </div>

            <div className="admin-dashboard-stats">

              <div className="admin-dashboard-card">
                <div className="admin-dashboard-card-icon">💰</div>
                <div>
                  <span>Total Sales</span>
                  <strong>
                    ₹{dashboardTotalSales.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <small>Cancelled orders excluded</small>
                </div>
              </div>

              <div className="admin-dashboard-card">
                <div className="admin-dashboard-card-icon">📦</div>
                <div>
                  <span>Total Orders</span>
                  <strong>{dashboardTotalOrders}</strong>
                  <small>All order statuses</small>
                </div>
              </div>

              <div className="admin-dashboard-card">
                <div className="admin-dashboard-card-icon">👥</div>
                <div>
                  <span>Customers</span>
                  <strong>{adminCustomers.length}</strong>
                  <small>Registered customers</small>
                </div>
              </div>

              <div className="admin-dashboard-card">
                <div className="admin-dashboard-card-icon">🛒</div>
                <div>
                  <span>Products</span>
                  <strong>{products.length}</strong>
                  <small>Products in catalog</small>
                </div>
              </div>

            </div>

            <div className="admin-dashboard-grid">

              <div className="admin-dashboard-panel">

                <div className="admin-dashboard-panel-header">
                  <div>
                    <h3>Order Status</h3>
                    <p>Current order breakdown.</p>
                  </div>
                </div>

                <div className="admin-status-grid">

                  <div className="admin-status-item">
                    <span>⏳ Pending</span>
                    <strong>{dashboardPendingOrders}</strong>
                  </div>

                  <div className="admin-status-item">
                    <span>🔵 Confirmed</span>
                    <strong>{dashboardConfirmedOrders}</strong>
                  </div>

                  <div className="admin-status-item">
                    <span>🚚 Shipped</span>
                    <strong>{dashboardShippedOrders}</strong>
                  </div>

                  <div className="admin-status-item">
                    <span>✅ Delivered</span>
                    <strong>{dashboardDeliveredOrders}</strong>
                  </div>

                  <div className="admin-status-item">
                    <span>❌ Cancelled</span>
                    <strong>{dashboardCancelledOrders}</strong>
                  </div>

                </div>

              </div>

              <div className="admin-dashboard-panel">

                <div className="admin-dashboard-panel-header">
                  <div>
                    <h3>Low Stock</h3>
                    <p>Products with 10 or fewer items.</p>
                  </div>
                  <span className="admin-dashboard-badge">
                    {dashboardLowStockProducts.length}
                  </span>
                </div>

                {dashboardLowStockProducts.length === 0 ? (
                  <div className="admin-dashboard-empty">
                    <span>✅</span>
                    <p>All products have healthy stock levels.</p>
                  </div>
                ) : (
                  <div className="admin-low-stock-list">
                    {dashboardLowStockProducts.map((product) => (
                      <div
                        className="admin-low-stock-item"
                        key={product.id}
                      >
                        <div>
                          <strong>
                            {getProductEmoji(product)} {product.name}
                          </strong>
                          <span>
                            {product.weight || "Weight not set"}
                          </span>
                        </div>
                        <b>
                          {Number(product.stock || 0)} left
                        </b>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>

            <div className="admin-dashboard-panel admin-recent-orders-panel">

              <div className="admin-dashboard-panel-header">
                <div>
                  <h3>Recent Orders</h3>
                  <p>Latest 5 orders in the system.</p>
                </div>
                <span className="admin-dashboard-badge">
                  {dashboardRecentOrders.length}
                </span>
              </div>

              {dashboardRecentOrders.length === 0 ? (
                <div className="admin-dashboard-empty">
                  <span>📦</span>
                  <p>No orders yet.</p>
                </div>
              ) : (
                <div className="admin-recent-orders-list">

                  {dashboardRecentOrders.map((order) => (
                    <div
                      className="admin-recent-order-item"
                      key={order.id}
                    >

                      <div className="admin-recent-order-main">
                        <strong>Order #{order.id}</strong>
                        <span>
                          {order.customer_name || "Customer"}
                        </span>
                      </div>

                      <div className="admin-recent-order-date">
                        {order.created_at
                          ? new Date(
                              order.created_at
                            ).toLocaleString()
                          : "Date unavailable"}
                      </div>

                      <div className="admin-recent-order-total">
                        ₹
                        {Number(
                          order.total_amount || 0
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>

                      <span
                        className={`admin-recent-order-status status-${String(
                          order.status || "Pending"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {order.status || "Pending"}
                      </span>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </div>

          {/* ================================= */}
          {/* PRODUCT MANAGEMENT */}
          {/* ================================= */}

          <div className="admin-section">

            <div className="admin-title-row">

              <h2>
                Product Management
              </h2>

              <button
                className="admin-add-product-button"
                onClick={
                  startAddProduct
                }
              >
                + Add Product
              </button>

            </div>

            {showProductForm && (
              <div className="product-admin-form">

                <h3>
                  {editingProductId
                    ? "Edit Product"
                    : "Add New Product"}
                </h3>

                <form
                  onSubmit={
                    handleSaveProduct
                  }
                >

                  <input
                    type="text"
                    placeholder="Product Name"
                    value={
                      productForm.name
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        name:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    value={
                      productForm.price
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        price:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Weight e.g. 250g"
                    value={
                      productForm.weight
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        weight:
                          e.target.value,
                      })
                    }
                  />

                  <input
                    type="text"
                    placeholder="Emoji e.g. 🐟"
                    value={
                      productForm.emoji
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        emoji:
                          e.target.value,
                      })
                    }
                  />

                  <input
                    type="number"
                    placeholder="Stock"
                    min="0"
                    value={
                      productForm.stock
                    }
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <div className="product-form-buttons">

                    <button
                      type="submit"
                    >
                      {editingProductId
                        ? "Update Product"
                        : "Add Product"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        resetProductForm
                      }
                    >
                      Cancel
                    </button>

                  </div>

                </form>
              </div>
            )}

            <div className="admin-products-grid">

              {products.length === 0 ? (
                <div className="no-orders">
                  <p>
                    No products found.
                  </p>
                </div>
              ) : (
                products.map(
                  (product) => (
                    <div
                      className="admin-product-card"
                      key={product.id}
                    >

                      <div className="admin-product-emoji">
                        {getProductEmoji(product)}
                      </div>

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        Weight:{" "}
                        {product.weight ||
                          "N/A"}
                      </p>

                      <p>
                        Price: ₹
                        {Number(
                          product.price
                        ).toFixed(2)}
                      </p>

                      <p>
                        Stock:{" "}
                        {product.stock}
                      </p>

                      <div className="admin-product-buttons">

                        <button
                          onClick={() =>
                            startEditProduct(
                              product
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteProduct(
                              product.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </div>

          {/* ================================= */}
          {/* DELIVERY MANAGEMENT */}
          {/* ================================= */}

          <div className="admin-section">

            <div className="admin-title-row">

              <div>
                <h2>
                  🚚 Delivery Management
                </h2>

                <p className="admin-section-subtitle">
                  Manage delivery dates and tracking numbers for customer orders.
                </p>
              </div>

              <span className="order-count">
                {adminOrders.length} Orders
              </span>

            </div>

            {adminOrders.length === 0 ? (

              <div className="no-orders">

                <h3>
                  No orders available
                </h3>

                <p>
                  Delivery information will appear here when customers place orders.
                </p>

              </div>

            ) : (

              <div className="delivery-admin-list">

                {adminOrders.map((order) => (

                  <div
                    className="delivery-admin-card"
                    key={order.id}
                  >

                    <div className="delivery-admin-header">

                      <div>
                        <h3>
                          Order #{order.id}
                        </h3>

                        <p>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString()
                            : "Order date unavailable"}
                        </p>
                      </div>

                      <span
                        className={`order-status ${String(
                          order.status || "Pending"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {order.status || "Pending"}
                      </span>

                    </div>

                    <div className="delivery-customer-details">

                      <h4>
                        Customer Information
                      </h4>

                      <div className="delivery-customer-grid">

                        <div>
                          <span>Customer Name</span>
                          <strong>
                            {order.customer_name || "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>Phone</span>
                          <strong>
                            {order.phone || "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>City</span>
                          <strong>
                            {order.city || "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>PIN Code</span>
                          <strong>
                            {order.pin_code || "N/A"}
                          </strong>
                        </div>

                      </div>

                      <div className="delivery-address">
                        <span>Full Delivery Address</span>
                        <strong>
                          {order.address || "Address not available"}
                        </strong>
                      </div>

                    </div>

                    <div className="delivery-admin-form">

                      <div className="delivery-form-field">
                        <label>
                          📅 Delivery Date
                        </label>

                      <input
  type="date"
  value={
    order.delivery_date
      ? String(order.delivery_date).slice(0, 10)
      : ""
  }
  onChange={(e) => {
    updateDeliveryField(
      order.id,
      "delivery_date",
      e.target.value
    );
  }}
  onClick={(e) => e.stopPropagation()}
  onFocus={(e) => e.stopPropagation()}
/>
                      </div>

                      <div className="delivery-form-field">
                        <label>
                          📦 Tracking Number
                        </label>

                        <input
                          type="text"
                          placeholder="Enter tracking number"
                          value={order.tracking_number || ""}
                          onChange={(e) =>
                            updateDeliveryField(
                              order.id,
                              "tracking_number",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="save-delivery-button"
                        onClick={() =>
                          saveDeliveryDetails(order.id)
                        }
                        disabled={savingDeliveryId === order.id}
                      >
                        {savingDeliveryId === order.id
                          ? "Saving..."
                          : "💾 Save Delivery Details"}
                      </button>

                    </div>

                    <div className="delivery-admin-summary">

                      <div>
                        <span>Current Status</span>
                        <strong>
                          {order.status || "Pending"}
                        </strong>
                      </div>

                      <div>
                        <span>Delivery Date</span>
                        <strong>
                          {order.delivery_date
                            ? new Date(
                                `${String(order.delivery_date).slice(0, 10)}T00:00:00`
                              ).toLocaleDateString()
                            : "Not scheduled"}
                        </strong>
                      </div>

                      <div>
                        <span>Tracking Number</span>
                        <strong>
                          {order.tracking_number || "Not assigned"}
                        </strong>
                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* ================================= */}
          {/* CUSTOMER MANAGEMENT */}
          {/* ================================= */}

          <div className="admin-section">

            <div className="admin-title-row">

              <div>
                <h2>
                  Customer Management
                </h2>

                <p className="admin-section-subtitle">
                  Registered customers and their order history.
                </p>
              </div>

              <span className="order-count">
                {adminCustomers.length} Customers
              </span>

            </div>

            <div className="customer-admin-toolbar">

              <input
                type="text"
                placeholder="Search by name or email"
                value={customerSearch}
                onChange={(e) =>
                  setCustomerSearch(e.target.value)
                }
                className="customer-search-input"
              />

              <button
                type="button"
                className="admin-refresh-button"
                onClick={exportAdminCustomers}
                disabled={loadingAdminCustomers || adminCustomers.length === 0}
              >
                📥 Export Customers
              </button>

              <button
                type="button"
                className="admin-refresh-button"
                onClick={loadAdminCustomers}
                disabled={loadingAdminCustomers}
              >
                🔄 Refresh Customers
              </button>

            </div>

            {loadingAdminCustomers ? (
              <div className="no-orders">
                <p>Loading customers...</p>
              </div>
            ) : adminCustomers.length === 0 ? (
              <div className="no-orders">
                <h3>No customers found</h3>
                <p>
                  Registered customers will appear here.
                </p>
              </div>
            ) : (
              <div className="customers-admin-grid">

                {adminCustomers
                  .filter((customer) => {
                    const search =
                      customerSearch.trim().toLowerCase();

                    if (!search) {
                      return true;
                    }

                    return (
                      String(customer.name || "")
                        .toLowerCase()
                        .includes(search) ||
                      String(customer.email || "")
                        .toLowerCase()
                        .includes(search)
                    );
                  })
                  .map((customer) => (
                    <div
                      className="customer-admin-card"
                      key={customer.id}
                    >

                      <div className="customer-admin-icon">
                        👤
                      </div>

                      <div className="customer-admin-main">

                        <h3>
                          {customer.name || "Unknown Customer"}
                        </h3>

                        <p>
                          <strong>Email:</strong>{" "}
                          {customer.email || "Not available"}
                        </p>

                        <p>
                          <strong>Customer ID:</strong>{" "}
                          #{customer.id}
                        </p>

                        <div className="customer-admin-stats">

                          <div>
                            <span>Orders</span>
                            <strong>
                              {customer.orderCount}
                            </strong>
                          </div>

                          <div>
                            <span>Total Spent</span>
                            <strong>
                              ₹{Number(
                                customer.totalSpent || 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <span>Last Order</span>
                            <strong>
                              {customer.lastOrderDate
                                ? new Date(
                                    customer.lastOrderDate
                                  ).toLocaleDateString()
                                : "No orders"}
                            </strong>
                          </div>

                        </div>

                        <button
                          type="button"
                          className="customer-view-details-button"
                          onClick={() => setSelectedAdminCustomer(customer)}
                        >
                          👁️ View Details & Order History
                        </button>

                      </div>

                    </div>
                  ))}

                {adminCustomers.filter((customer) => {
                  const search =
                    customerSearch.trim().toLowerCase();

                  if (!search) {
                    return true;
                  }

                  return (
                    String(customer.name || "")
                      .toLowerCase()
                      .includes(search) ||
                    String(customer.email || "")
                      .toLowerCase()
                      .includes(search)
                  );
                }).length === 0 && (
                  <div className="no-orders">
                    <p>
                      No customers match your search.
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* ================================= */}
          {/* CUSTOMER DETAILS MODAL */}
          {/* ================================= */}

          {selectedAdminCustomer && (() => {
            const customerOrders = adminOrders
              .filter((order) =>
                Number(order.user_id) === Number(selectedAdminCustomer.id)
              )
              .sort(
                (a, b) =>
                  new Date(b.created_at || 0) -
                  new Date(a.created_at || 0)
              );

            return (
              <div
                className="customer-details-overlay"
                onClick={() => setSelectedAdminCustomer(null)}
              >
                <div
                  className="customer-details-modal"
                  onClick={(e) => e.stopPropagation()}
                >

                  <div className="customer-details-modal-header">
                    <div>
                      <h2>Customer Details</h2>
                      <p>Complete customer information and order history.</p>
                    </div>

                    <button
                      type="button"
                      className="customer-details-close"
                      onClick={() => setSelectedAdminCustomer(null)}
                      aria-label="Close customer details"
                    >
                      ×
                    </button>
                  </div>

                  <div className="customer-details-profile">
                    <div className="customer-details-avatar">👤</div>
                    <div>
                      <h3>{selectedAdminCustomer.name || "Unknown Customer"}</h3>
                      <p>{selectedAdminCustomer.email || "Email not available"}</p>
                      <span>Customer ID: #{selectedAdminCustomer.id}</span>
                    </div>
                  </div>

                  <div className="customer-details-summary">
                    <div>
                      <span>Total Orders</span>
                      <strong>{selectedAdminCustomer.orderCount}</strong>
                    </div>
                    <div>
                      <span>Total Spent</span>
                      <strong>₹{Number(selectedAdminCustomer.totalSpent || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Last Order</span>
                      <strong>
                        {selectedAdminCustomer.lastOrderDate
                          ? new Date(selectedAdminCustomer.lastOrderDate).toLocaleDateString()
                          : "No orders"}
                      </strong>
                    </div>
                  </div>

                  <div className="customer-details-orders">
                    <div className="customer-details-orders-title">
                      <h3>Order History</h3>
                      <span>{customerOrders.length} order(s)</span>
                    </div>

                    {customerOrders.length === 0 ? (
                      <div className="customer-details-empty">
                        <p>No orders found for this customer.</p>
                      </div>
                    ) : (
                      <div className="customer-history-list">
                        {customerOrders.map((order) => (
                          <div className="customer-history-card" key={order.id}>
                            <div className="customer-history-top">
                              <div>
                                <h4>Order #{order.id}</h4>
                                <p>
                                  {order.created_at
                                    ? new Date(order.created_at).toLocaleString()
                                    : "Date not available"}
                                </p>
                              </div>
                              <span
                                className={`order-status ${String(order.status || "Pending")
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                              >
                                {order.status}
                              </span>
                            </div>

                            <div className="customer-history-items">
                              {Array.isArray(order.items) && order.items.map((item, index) => (
                                <div className="customer-history-item" key={`${order.id}-${index}`}>
                                  <span>
                                    {item.emoji || "📦"} {item.name} × {item.quantity}
                                  </span>
                                  <strong>
                                    ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                                  </strong>
                                </div>
                              ))}
                            </div>

                            <div className="customer-history-footer">
                              <strong>Total: ₹{Number(order.total_amount || 0).toFixed(2)}</strong>
                              <button
                                type="button"
                                className="customer-history-print-button"
                                onClick={() => printOrderInvoice(order)}
                              >
                                🧾 Print Receipt
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* ================================= */}
          {/* CUSTOMER ORDERS */}
          {/* ================================= */}

          <div className="admin-section">

            <div className="admin-title-row">

              <h2>
                Customer Orders
              </h2>

              <span className="order-count">
                {adminOrders.length} Orders
              </span>

            </div>

            {adminOrders.length === 0 ? (
              <div className="no-orders">

                <h3>
                  No orders found
                </h3>

                <p>
                  Customer orders will
                  appear here.
                </p>

              </div>
            ) : (
              <div className="orders-list">

                {adminOrders.map(
                  (order) => (
                    <div
                      className="admin-order-card"
                      key={order.id}
                    >

                      <div className="order-top">

                        <div>
                          <h3>
                            Order #
                            {order.id}
                          </h3>

                          <p>
                            {order.created_at
                              ? new Date(
                                  order.created_at
                                ).toLocaleString()
                              : ""}
                          </p>
                        </div>

                        <span
                          className={`order-status ${String(
                            order.status
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {order.status}
                        </span>

                      </div>

                      <div className="customer-details">

                        <h4>
                          Customer Details
                        </h4>

                        <p>
                          <strong>
                            Name:
                          </strong>{" "}
                          {
                            order.customer_name
                          }
                        </p>

                        <p>
                          <strong>
                            Phone:
                          </strong>{" "}
                          {order.phone}
                        </p>

                        <p>
                          <strong>
                            Address:
                          </strong>{" "}
                          {order.address}
                        </p>

                        <p>
                          <strong>
                            City:
                          </strong>{" "}
                          {order.city}
                        </p>

                        <p>
                          <strong>
                            PIN:
                          </strong>{" "}
                          {order.pin_code}
                        </p>

                      </div>

                      <div className="order-items">

                        <h4>
                          Products
                        </h4>

                        {Array.isArray(
                          order.items
                        ) &&
                          order.items.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                className="order-item"
                                key={index}
                              >

                                <span>
                                  {
                                    item.name
                                  }
                                </span>

                                <span>
                                  ₹
                                  {
                                    item.price
                                  }{" "}
                                  ×{" "}
                                  {
                                    item.quantity
                                  }
                                </span>

                              </div>
                            )
                          )}

                      </div>

                      <div className="order-total">
                        Total: ₹
                        {Number(
                          order.total_amount
                        ).toFixed(2)}
                      </div>

                      <div className="admin-status-control">

                        <label>
                          Update Status:
                        </label>

                        <select
                          value={
                            trackingStatuses.includes(order.status)
                              ? order.status
                              : "Pending"
                          }
                          onChange={(e) =>
                            updateOrderStatus(
                              order.id,
                              e.target.value
                            )
                          }
                          disabled={order.status === "Cancelled"}
                        >
                          {trackingStatuses.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>

                        {order.status !== "Cancelled" && (
                          <button
                            type="button"
                            className="cancel-order-button"
                            onClick={() =>
                              cancelOrder(order.id)
                            }
                          >
                            Cancel Order
                          </button>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN WEBSITE
  // ==========================================

  return (
    <div className="app">
{/* NAVBAR */}

<nav className="navbar">

  <div className="logo">
    KUBARAN
  </div>

  <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>

    <a href="#home" onClick={() => setMobileMenuOpen(false)}>
      Home
    </a>

    <a href="#products" onClick={() => setMobileMenuOpen(false)}>
      Products
    </a>

    <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>
      Reviews
    </a>

  </div>

  <div className="nav-actions">

    {loggedUser ? (
      <>
        <span className="welcome-user">
          Hi, {loggedUser.name}
        </span>

        <button
          className="account-button"
          onClick={openMyOrders}
        >
          My Orders
        </button>

        <button
          className="account-button"
          onClick={logoutCustomer}
        >
          Logout
        </button>
      </>
    ) : (
      <button
        className="account-button"
        onClick={() => setShowLogin(true)}
      >
        Login
      </button>
    )}

    <button
      className="cart-button"
      onClick={() => setShowCart(true)}
    >
      🛒 Cart ({cartCount})
    </button>

  </div>

  <button
    className="mobile-menu-button"
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    aria-label="Toggle navigation menu"
  >
    <span></span>
    <span></span>
    <span></span>
  </button>

</nav>


{/* HERO */}
<section className="hero kubaran-hero" id="home">
  <div className="hero-image">
    <img
      src={heroImage}
      alt="KUBARAN premium dried seafood"
    />
  </div>

  <div className="hero-image-overlay"></div>

  <div className="hero-content">
    <h1>
      Traditional Taste.
      <br />
      Premium Quality.
    </h1>

    <p>
      Premium quality dry fish
      and dry seafood delivered
      to your doorstep.
    </p>

    <a href="#products" className="hero-button">
      Shop Now
    </a>
  </div>
</section>

     {/* PRODUCTS */}
<section className="products-section" id="products">

  <div className="products-heading">

    <div>
      <p className="eyebrow">KUBARAN COLLECTION</p>

      <h2>
        Our Products
      </h2>

      <p className="products-intro">
        Carefully selected dry seafood for authentic flavour,
        everyday cooking, and traditional meals.
      </p>
    </div>

    <div className="products-count">
      <span>{products.length}</span>
      <small>Products</small>
    </div>

  </div>

  {loadingProducts ? (
    <div className="loading-products">
      <p>Loading products...</p>
    </div>
  ) : products.length === 0 ? (
    <div className="loading-products">
      <p>No products available.</p>
    </div>
  ) : (
    <div className="products-grid">

      {products.map((product) => (

        <article
          className="product-card"
          key={product.id}
        >

          <div className="product-image">

            {product.id === 1 ? (
              <img
                src={anchovyImage}
                alt={product.name}
              />
            ) : product.id === 2 ? (
              <img
                src={dryFishImage}
                alt={product.name}
              />
            ) : product.id === 3 ? (
              <img
                src={prawnsImage}
                alt={product.name}
              />
            ) : (
              getProductEmoji(product)
            )}

            <div className="product-number">
              0{product.id}
            </div>

          </div>

          <div className="product-info">

            <p className="product-category">
              DRY SEAFOOD
            </p>

            <h3>
              {product.name}
            </h3>

            <p className="weight">
              {product.weight}
            </p>

            <div className="product-stock-row">

              <span
                className={`stock-badge ${
                  getStockState(product.stock).className
                }`}
              >
                {getStockState(product.stock).label}
              </span>

              {Number(product.stock) > 0 &&
                Number(product.stock) <= 10 && (
                  <span className="stock-alert-text">
                    Selling fast
                  </span>
                )}

            </div>

            <div className="product-bottom">

              <div className="product-price">

                <small>PRICE</small>

                <span className="price">
                  ₹{Number(product.price).toFixed(2)}
                </span>

              </div>

              <button
                onClick={() => addToCart(product)}
                disabled={Number(product.stock) <= 0}
              >
                {Number(product.stock) <= 0
                  ? "Out of Stock"
                  : "Add to Cart"}
              </button>

            </div>

          </div>

        </article>

      ))}

    </div>
  )}

</section>

    {/* QUALITY */}
<section className="kubaran-quality" id="quality">
  <div className="quality-heading">
    <div className="story-index">S.03</div>

    <div>
      <p className="eyebrow">WHY KUBARAN</p>

      <h2>
        Quality you can trust.
        <br />
        Taste you can remember.
      </h2>

      <p className="quality-intro">
        We bring carefully selected dry fish products to your home with
        clear pricing, secure ordering, and reliable delivery tracking.
      </p>
    </div>
  </div>

  <div className="quality-grid">

    <article>
      <span>01</span>

      <h3>Traditional Taste</h3>

      <p>
        Inspired by coastal traditions and the familiar flavours of
        authentic home cooking.
      </p>
    </article>

    <article>
      <span>02</span>

      <h3>Carefully Selected</h3>

      <p>
        Our products are presented with clear information so you can
        choose the right product with confidence.
      </p>
    </article>

    <article>
      <span>03</span>

      <h3>Order Tracking</h3>

      <p>
        Follow your order from confirmation to shipment and delivery
        through your customer account.
      </p>
    </article>

    <article>
      <span>04</span>

      <h3>Secure Ordering</h3>

      <p>
        Your order details are handled through our online ordering
        system for a simple and convenient shopping experience.
      </p>
    </article>

  </div>
</section>

      {/* DELIVERY CTA */}
      <section className="kubaran-cta">
        <div><p className="eyebrow">S.04 / DELIVERY</p><h2>Good food should<br />arrive without guesswork.</h2></div>
        <div className="cta-side"><p>Place your order, follow the status and receive your dry seafood at your doorstep.</p><a href="#products" className="hero-button">Shop KUBARAN</a></div>
      </section>

{/* FOOTER */}
<footer className="kubaran-footer">
  <div className="footer-main">
    <div className="footer-brand">
      <div className="footer-logo">KUBARAN</div>

      <p>Premium Dry Fish & Seafood</p>

      <span>
        Traditional taste. Carefully selected.
        <br />
        Delivered to your doorstep.
      </span>
    </div>

    <div className="footer-links">
      <span className="footer-label">EXPLORE</span>
      <a href="#home">Home</a>
      <a href="#quality">Why KUBARAN</a>
      <a href="#products">Products</a>
    </div>

    <div className="footer-contact">
      <span className="footer-label">CONTACT</span>
      <a href="tel:+919751170173">+91 97511 70173</a>
      <a href="https://wa.me/919751170173">WhatsApp</a>
      <a href="mailto:imdharani777@gmail.com">
        imdharani777@gmail.com
      </a>
      <span>Dharmapuri, Tamil Nadu</span>
    </div>
{/* Admin Login shown in the public footer */}
{/* Admin Login shown in the public footer */}
<div className="footer-admin">
  <span className="footer-label">BUSINESS</span>
  <button
    className="footer-admin-button"
    onClick={() => setShowAdminLogin(true)}
  >
    Admin Login
  </button>
</div>

</div>

<div className="footer-bottom">
  <span>© 2026 KUBARAN</span>
  <span>PREMIUM DRY FISH & SEAFOOD</span>
  <span>ALL RIGHTS RESERVED</span>
</div>
</footer>
      {/* ====================================== */}
      {/* CART MODAL */}
      {/* ====================================== */}

      {showCart && (
        <div className="modal-overlay">

          <div className="modal cart-modal">

            <button
              className="close-button"
              onClick={() =>
                setShowCart(false)
              }
            >
              ×
            </button>

            <h2>
              Your Cart
            </h2>

            {cart.length === 0 ? (
              <div className="empty-cart">

                <p>
                  Your cart is empty.
                </p>

                <button
                  onClick={() =>
                    setShowCart(false)
                  }
                >
                  Continue Shopping
                </button>

              </div>
            ) : (
              <>

                <div className="cart-items">

                  {cart.map(
                    (item) => (
                      <div
                        className="cart-item"
                        key={item.id}
                      >

                        <div className="cart-item-info">

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            ₹
                            {Number(
                              item.price
                            ).toFixed(2)}
                          </p>

                          {(() => {
                            const liveProduct = products.find(
                              (product) => Number(product.id) === Number(item.id)
                            );
                            const stock = liveProduct
                              ? Number(liveProduct.stock)
                              : Number(item.stock) || 0;
                            const stockState = getStockState(stock);

                            return (
                              <span className={`cart-stock ${stockState.className}`}>
                                {stockState.label}
                              </span>
                            );
                          })()}

                        </div>

                        <div className="quantity-controls">

                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                            disabled={(() => {
                              const liveProduct = products.find(
                                (product) => Number(product.id) === Number(item.id)
                              );
                              return liveProduct
                                ? Number(item.quantity) >= Number(liveProduct.stock)
                                : false;
                            })()}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>

                        </div>

                        <button
                          className="remove-button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>
                    )
                  )}

                </div>

                <div className="cart-total">
                  Total: ₹
                  {totalAmount.toFixed(
                    2
                  )}
                </div>

                <button
                  className="checkout-button"
                  onClick={
                    openCheckout
                  }
                >
                  Proceed to Checkout
                </button>

              </>
            )}

          </div>

        </div>
      )}

      {/* ====================================== */}
      {/* LOGIN MODAL */}
      {/* ====================================== */}

      {showLogin && (
        <div className="modal-overlay">

          <div className="modal auth-modal">

            <button
              className="close-button"
              onClick={() =>
                setShowLogin(false)
              }
            >
              ×
            </button>

            <h2>
              Customer Login
            </h2>

            <form
              onSubmit={handleLogin}
            >

              <input
                type="email"
                placeholder="Email"
                value={
                  loginForm.email
                }
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    email:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={
                  loginForm.password
                }
                onChange={(e) =>
                  setLoginForm({
                    ...loginForm,
                    password:
                      e.target.value,
                  })
                }
                required
              />

              <button type="submit">
                Login
              </button>

            </form>

            <p className="switch-auth">

              Don't have an account?

              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
              >
                Register
              </button>

            </p>

          </div>

        </div>
      )}

      {/* ====================================== */}
      {/* REGISTER MODAL */}
      {/* ====================================== */}

      {showRegister && (
        <div className="modal-overlay">

          <div className="modal auth-modal">

            <button
              className="close-button"
              onClick={() =>
                setShowRegister(false)
              }
            >
              ×
            </button>

            <h2>
              Create Account
            </h2>

            <form
              onSubmit={
                handleRegister
              }
            >

              <input
                type="text"
                placeholder="Full Name"
                value={
                  registerForm.name
                }
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    name:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={
                  registerForm.email
                }
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    email:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={
                  registerForm.password
                }
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    password:
                      e.target.value,
                  })
                }
                required
              />

              <button type="submit">
                Register
              </button>

            </form>

            <p className="switch-auth">

              Already have an account?

              <button
                onClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              >
                Login
              </button>

            </p>

          </div>

        </div>
      )}

      {/* ====================================== */}
      {/* CHECKOUT MODAL */}
      {/* ====================================== */}

      {showCheckout && (
        <div className="modal-overlay">

          <div className="modal checkout-modal address-checkout-modal">

            <button
              className="close-button"
              onClick={() =>
                setShowCheckout(false)
              }
            >
              ×
            </button>

            <div className="address-checkout-heading">
              <p className="address-checkout-eyebrow">DELIVERY ADDRESS</p>
              <h2>Add Address Details</h2>
              <p>Choose a place on the map or enter the full address where you want your order delivered.</p>
            </div>

            <form
              className="address-checkout-form"
              onSubmit={
                handlePlaceOrder
              }
            >
              <div className="address-checkout-grid">
                <section className="address-map-column" aria-label="Map preview">
                  <div className="address-map-frame">
                    <DeliveryMap
                      pin={mapPin}
                      onPinSelect={(pin) => {
                        setMapPin(pin);
                        lookupAddressFromCoordinates(pin.latitude, pin.longitude);
                      }}
                    />
                  </div>
                  <p className="address-map-message" role="status">{mapMessage}</p>
                  <div className="address-map-actions">
                    <button type="button" onClick={previewCurrentLocation}>Use my location</button>
                  </div>
                  <p className="address-map-help">Click the map or drag the pin to mark the delivery point. Location access is optional.</p>
                  <p className="address-geocoding-attribution">
                    Address lookup by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a>
                  </p>
                </section>

                <section className="address-details-column" aria-label="Delivery details">
                  <div className="address-type-picker" role="group" aria-label="Address type">
                    {["Home", "Office", "Other"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={addressType === type ? "selected" : ""}
                        aria-pressed={addressType === type}
                        onClick={() => setAddressType(type)}
                      >
                        {type} {addressType === type ? "✓" : ""}
                      </button>
                    ))}
                  </div>

              <input
                type="text"
                aria-label="Customer name"
                autoComplete="name"
                placeholder="Customer Name"
                value={
                  checkoutForm.customerName
                }
                onChange={(e) =>
                  setCheckoutForm({
                    ...checkoutForm,
                    customerName:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="tel"
                aria-label="Phone number"
                autoComplete="tel"
                placeholder="Phone Number"
                value={
                  checkoutForm.phone
                }
                onChange={(e) =>
                  setCheckoutForm({
                    ...checkoutForm,
                    phone:
                      e.target.value,
                  })
                }
                required
              />

              <textarea
                aria-label="House, street, area, and landmark"
                autoComplete="street-address"
                placeholder="Full Address"
                value={
                  checkoutForm.address
                }
                onChange={(e) =>
                  setCheckoutForm({
                    ...checkoutForm,
                    address:
                      e.target.value,
                  })
                }
                required
              />

              <div className="address-location-fields">
              <input
                type="text"
                aria-label="City"
                autoComplete="address-level2"
                placeholder="City"
                value={
                  checkoutForm.city
                }
                onChange={(e) =>
                  setCheckoutForm({
                    ...checkoutForm,
                    city:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                aria-label="PIN code"
                autoComplete="postal-code"
                inputMode="numeric"
                placeholder="PIN Code"
                value={
                  checkoutForm.pinCode
                }
                onChange={(e) =>
                  setCheckoutForm({
                    ...checkoutForm,
                    pinCode:
                      e.target.value,
                  })
                }
                required
              />
              </div>
                </section>
              </div>

              <div className="checkout-summary">

                <span>
                  Order Total
                </span>

                <strong>
                  ₹
                  {totalAmount.toFixed(
                    2
                  )}
                </strong>

              </div>

              <button
                type="submit"
                disabled={placing}
              >
                {placing
                  ? "Placing Order..."
                  : "Place Order"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* ====================================== */}
      {/* MY ORDERS MODAL */}
      {/* ====================================== */}

      {showMyOrders && (
        <div className="modal-overlay">

         <div className="modal my-orders-modal">

  <button
    className="close-button"
    onClick={() =>
      setShowMyOrders(false)
    }
  >
    ×
  </button>

  <div className="my-orders-heading">
    <div>
      <p className="my-orders-eyebrow">
        KUBARAN ACCOUNT
      </p>

      <h2>
        My Orders
      </h2>

      <p className="my-orders-intro">
        Track your purchases, delivery status and order history.
      </p>
    </div>

    <div className="my-orders-summary">
      <span>{myOrders.length}</span>
      <small>Total Orders</small>
    </div>
  </div>

            {loadingMyOrders ? (
              <p>
                Loading your orders...
              </p>
            ) : myOrders.length === 0 ? (
              <div className="empty-cart">

                <p>
                  You have not placed
                  any orders yet.
                </p>

              </div>
            ) : (
              <>
                <div className="my-orders-toolbar">
                  <div className="my-orders-search">
                    <label>Search Orders</label>
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Order ID, product or status"
                    />
                  </div>

                  <div className="my-orders-filter">
                    <label>Status</label>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      {trackingStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="my-orders-filter">
                    <label>Date</label>
                    <input
                      type="date"
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="my-orders-refresh-button"
                    onClick={loadMyOrders}
                    disabled={loadingMyOrders}
                  >
                    🔄 Refresh
                  </button>

                  <button
                    type="button"
                    className="my-orders-clear-button"
                    onClick={clearOrderFilters}
                  >
                    Clear Filters
                  </button>
                </div>

                <div className="my-orders-result-count">
                  Showing {filteredMyOrders.length} of {myOrders.length} orders
                </div>

                {filteredMyOrders.length === 0 ? (
                  <div className="empty-cart filtered-orders-empty">
                    <p>No orders match your search or filters.</p>
                    <button type="button" onClick={clearOrderFilters}>
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="my-orders-list">
                    {filteredMyOrders.map(
                  (order) => {

                    const statusIndex =
                      getStatusIndex(
                        order.status
                      );

                    return (
                      <div
                        className="customer-order-card"
                        key={order.id}
                      >

                        <div className="customer-order-header">

                          <div>
                            <h3>
                              Order #
                              {order.id}
                            </h3>

                            <p>
                              {order.created_at
                                ? new Date(
                                    order.created_at
                                  ).toLocaleString()
                                : ""}
                            </p>
                          </div>

                          <span
                            className={`customer-order-status customer-status-${String(
                              order.status || "Pending"
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {order.status}
                          </span>

                        </div>

                    {/* ORDER TRACKING */}

{order.status === "Cancelled" ? (
  <div className="cancelled-order-box">
    <div className="cancelled-order-icon">
      ✕
    </div>

    <div>
      <p className="tracking-eyebrow">
        ORDER UPDATE
      </p>

      <h4>Order Cancelled</h4>

      <p>
        This order has been cancelled and the
        product stock has been returned.
      </p>
    </div>
  </div>
) : (
  <>
    <div className="order-tracking">

      {trackingStatuses.map((status, index) => (
        <React.Fragment key={status}>

          <div
            className={`tracking-step ${
              index <= statusIndex ? "active" : ""
            }`}
          >

            <div className="tracking-circle">
              {index < statusIndex
                ? "✓"
                : index === statusIndex
                ? "●"
                : index + 1}
            </div>

            <div className="tracking-step-content">
              <span className="tracking-step-number">
                0{index + 1}
              </span>

              <span className="tracking-step-name">
                {status}
              </span>
            </div>

          </div>

          {index < trackingStatuses.length - 1 && (
            <div
              className={`tracking-line ${
                index < statusIndex ? "active" : ""
              }`}
            />
          )}

        </React.Fragment>
      ))}

    </div>

    {/* TRACKING MESSAGE */}

    <div className="tracking-message">

      <span className="tracking-message-label">
        CURRENT STATUS
      </span>

      <div className="tracking-message-text">

        {order.status === "Pending" && (
          <>
            🕐 Your order has been received and is
            waiting for confirmation.
          </>
        )}

        {order.status === "Confirmed" && (
          <>
            ✅ Your order has been confirmed and is
            being prepared.
          </>
        )}

        {order.status === "Shipped" && (
          <>
            🚚 Your order has been shipped and is
            on the way.
          </>
        )}

        {order.status === "Delivered" && (
          <>
            🎉 Your order has been delivered.
            Thank you for shopping with KUBARAN!
          </>
        )}

      </div>

    </div>
  </>
)}

                        {/* PRODUCTS */}

                        <div className="customer-order-items">

                          <h4>
                            Products
                          </h4>

                          {Array.isArray(
                            order.items
                          ) &&
                            order.items.map(
                              (
                                item,
                                index
                              ) => (
                                <div
                                  className="customer-order-item"
                                  key={index}
                                >

                                  <span>
                                    {
                                      item.name
                                    }
                                  </span>

                                  <span>
                                    ₹{Number(item.price).toFixed(2)} × {item.quantity}
                                    <strong className="customer-item-subtotal">
                                      = ₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                    </strong>
                                  </span>

                                </div>
                              )
                            )}

                        </div>

                        <div className="customer-delivery-info">
                          <h4>🚚 Delivery Information</h4>

                          {order.delivery_date ? (
                            <p>
                              <strong>Expected Delivery:</strong>{" "}
                              {new Date(
                                `${String(order.delivery_date).slice(0, 10)}T00:00:00`
                              ).toLocaleDateString()}
                            </p>
                          ) : (
                            <p>
                              <strong>Expected Delivery:</strong> Not scheduled yet
                            </p>
                          )}

                          {order.tracking_number ? (
                            <p>
                              <strong>Tracking Number:</strong>{" "}
                              {order.tracking_number}
                            </p>
                          ) : (
                            <p>
                              <strong>Tracking Number:</strong> Not assigned yet
                            </p>
                          )}
                        </div>

                        <div className="customer-order-total">
                          <span>Order Total</span>
                          <strong>
                            ₹{Number(order.total_amount).toFixed(2)}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="print-order-button"
                          onClick={() => printOrderInvoice(order)}
                        >
                          🧾 Print / Save Receipt
                        </button>

                      </div>
                    );
                  }
                )}
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}

      {/* ====================================== */}
      {/* ADMIN LOGIN MODAL */}
      {/* ====================================== */}

      {showAdminLogin && (
        <div className="modal-overlay">

          <div className="modal auth-modal">

            <button
              className="close-button"
              onClick={() =>
                setShowAdminLogin(false)
              }
            >
              ×
            </button>

            <h2>
              Admin Login
            </h2>

            <form
              onSubmit={
                handleAdminLogin
              }
            >

              <input
                type="text"
                placeholder="Admin Username"
                value={
                  adminLogin.username
                }
                onChange={(e) =>
                  setAdminLogin({
                    ...adminLogin,
                    username:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Admin Password"
                value={
                  adminLogin.password
                }
                onChange={(e) =>
                  setAdminLogin({
                    ...adminLogin,
                    password:
                      e.target.value,
                  })
                }
                required
              />

              <button type="submit">
                Admin Login
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;
