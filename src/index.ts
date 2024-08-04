import app from './app';
import env from './configs/env';

// Start the server
app.listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
});
