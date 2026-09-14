# AI-Enhanced E-commerce Marketplace

A full-stack e-commerce marketplace developed as a Software Engineering capstone project.

The system supports multiple user roles and integrates AI features including semantic product search and a Retrieval-Augmented Generation (RAG) shopping assistant.

## Key Features

### Authentication & Authorization

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Supported roles:
  - Guest
  - Buyer
  - Seller
  - Admin

### Seller Features

- Create, update, and delete products
- Upload multiple product images
- Manage product variants
- Manage product inventory
- View store orders
- Update order status

### Buyer Features

- Browse and search products
- Semantic AI-powered product search
- View product details
- View similar product recommendations
- Add products to cart
- Update and remove cart items
- Checkout and place orders
- View order history
- Request product returns
- Message sellers

### Admin Features

- View pending products
- Approve products before they become publicly available
- Manage seller accounts
- View basic system reports

### Order Management

The order process uses database transactions to maintain data consistency.

When an order is placed, the system:

1. Creates the order
2. Creates order items
3. Updates product stock
4. Clears the shopping cart

If an error occurs during the process, the transaction can be rolled back.

### Buyer-Seller Messaging

The system includes a messaging feature between buyers and sellers.

System messages can also be generated automatically when important order events occur.

## AI Features

### Semantic Product Search

Product information is converted into vector embeddings using:

`all-MiniLM-L6-v2`

The system compares query embeddings and product embeddings using cosine similarity to retrieve semantically relevant products.

This allows users to search using natural-language queries rather than relying only on exact keyword matching.

### RAG Shopping Assistant

The application includes an AI shopping chatbot using a Retrieval-Augmented Generation workflow.

The process includes:

1. Receive the user's shopping question
2. Retrieve relevant products using semantic search
3. Provide the retrieved product information as context
4. Generate a response using the Gemini API
5. Display recommended products in the chatbot interface

The chatbot also includes a fallback mechanism when the AI service is unavailable.

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Context API
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- RESTful API
- JWT
- bcrypt
- Multer

### Database

- MySQL

Main entities include:

- Users
- Products
- Categories
- Product Images
- Product Variants
- Carts
- Cart Items
- Orders
- Order Items
- Conversations
- Messages
- Embeddings

### AI

- all-MiniLM-L6-v2
- Transformers.js
- Cosine Similarity
- Gemini API
- Retrieval-Augmented Generation (RAG)

## Project Structure

```text
AI-Enhanced-Ecommerce-Marketplace/
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── uploads/
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── ...
│   └── ...
│
├── .gitignore
└── README.md