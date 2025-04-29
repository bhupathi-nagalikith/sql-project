const express = require('express');
const mysql = require('mysql2/promise');

const cors = require('cors');  // Import the CORS middleware

const app = express();
const port = 3020;  // Ensure this is the correct port for your backend

app.use(cors()); 
app.use(express.json());
app.use(express.static('public')); 

// Connect to your MySQL database
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ammu456',
  database: 'feedback'
});

// API to handle query based on task
app.post('/api/run-query', async (req, res) => {
  const { task } = req.body;
  let query = '';

  switch(task) {
    case 'fetch_product_sentiment_breakdown':
      query = `
        SELECT 
          p.name AS product_name,
          SUM(CASE WHEN f.sentiment = 'Positive' THEN 1 ELSE 0 END) AS positive_count,
          SUM(CASE WHEN f.sentiment = 'Negative' THEN 1 ELSE 0 END) AS negative_count,
          SUM(CASE WHEN f.sentiment = 'Neutral' THEN 1 ELSE 0 END) AS neutral_count
        FROM Feedback f
        JOIN Products p ON f.product_id = p.product_id
        GROUP BY p.name;
      `;
      break;

    case 'top_5_customers_feedback':
      query = `
        SELECT c.name, COUNT(f.feedback_id) AS feedback_count
        FROM Feedback f
        JOIN Customers c ON f.customer_id = c.customer_id
        GROUP BY c.name
        ORDER BY feedback_count DESC
        LIMIT 5;
      `;
      break;

    case 'daily_feedback_report':
      query = `
        SELECT 
          feedback_date,
          COUNT(*) AS total_feedback,
          SUM(CASE WHEN sentiment = 'Positive' THEN 1 ELSE 0 END) AS positive_feedbacks,
          SUM(CASE WHEN sentiment = 'Negative' THEN 1 ELSE 0 END) AS negative_feedbacks,
          SUM(CASE WHEN sentiment = 'Neutral' THEN 1 ELSE 0 END) AS neutral_feedbacks
        FROM Feedback
        GROUP BY feedback_date;
      `;
      break;

    case 'product_sentiment_analysis':
      query = `
        SELECT p.name AS product_name, f.sentiment, COUNT(*) AS sentiment_count
        FROM Feedback f
        JOIN Products p ON f.product_id = p.product_id
        GROUP BY p.name, f.sentiment;
      `;
      break;

    case 'country_feedback_distribution':
      query = `
        SELECT c.country, COUNT(f.feedback_id) AS feedback_count
        FROM Feedback f
        JOIN Customers c ON f.customer_id = c.customer_id
        GROUP BY c.country;
      `;
      break;

    case 'products_highest_positive_feedback':
      query = `
        SELECT p.name
        FROM Products p
        JOIN (
          SELECT product_id, COUNT(*) AS positive_count
          FROM Feedback
          WHERE sentiment = 'Positive'
          GROUP BY product_id
        ) t ON p.product_id = t.product_id
        ORDER BY positive_count DESC
        LIMIT 1;
      `;
      break;

    case 'customers_most_feedback':
      query = `
        SELECT name
        FROM Customers
        WHERE customer_id = (
          SELECT customer_id
          FROM Feedback
          GROUP BY customer_id
          ORDER BY COUNT(*) DESC
          LIMIT 1
        );
      `;
      break;

    case 'average_sentiment_per_category':
      query = `
        SELECT 
          p.category,
          AVG(CASE 
            WHEN f.sentiment = 'Positive' THEN 1
            WHEN f.sentiment = 'Neutral' THEN 0.5
            WHEN f.sentiment = 'Negative' THEN 0
          END) AS average_sentiment_score
        FROM Feedback f
        JOIN Products p ON f.product_id = p.product_id
        GROUP BY p.category;
      `;
      break;

    case 'feedback_with_customer_product_info':
      query = `
        SELECT 
          f.feedback_text,
          f.feedback_date,
          f.sentiment,
          c.name AS customer_name,
          p.name AS product_name
        FROM Feedback f
        JOIN Customers c ON f.customer_id = c.customer_id
        JOIN Products p ON f.product_id = p.product_id;
      `;
      break;

    case 'sentiment_trend_per_product':
      query = `
        SELECT 
          p.name AS product_name,
          f.feedback_date,
          f.sentiment,
          COUNT(*) AS sentiment_count
        FROM Feedback f
        JOIN Products p ON f.product_id = p.product_id
        GROUP BY p.name, f.feedback_date, f.sentiment
        ORDER BY f.feedback_date;
      `;
      break;

    case 'feedback_sentiment_by_country':
      query = `
        SELECT 
          c.country,
          f.sentiment,
          COUNT(*) AS sentiment_count
        FROM Feedback f
        JOIN Customers c ON f.customer_id = c.customer_id
        GROUP BY c.country, f.sentiment;
      `;
      break;

    default:
      return res.status(400).json({ message: 'Invalid task' });
  }

  try {
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Query execution failed' });
  }
});

const path = require('path');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
