import dotenv from 'dotenv';
import { app } from './App.js';
import connectDB from './db/index.js';

dotenv.config({
    path: './.env'
});
const PORT = process.env.PORT || 8001;
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on PORT ${PORT}`);
        });
        
    })
    .catch((error) => {
        console.log('Error in connecting to the database', error);
        process.exit(1);
    });