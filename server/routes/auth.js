// Login endpoint me token add karo
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // User authentication logic...
    const user = await authenticateUser(username, password);
    
    if (user) {
      // Generate token
      const token = 'auth_token_' + Date.now() + '_' + user.id;
      
      res.json({
        ...user,
        token: token  // Add this line
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});