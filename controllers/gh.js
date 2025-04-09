const userSchema = new mongoose.Schema({  
    // ... other fields ...  
    avatar: {  
        url: {  
            type: String,  
            required: true  
        },  
        public_id: {  
            type: String,  
            required: true  
        }  
    },  
    coverImage: {  
        url: {  
            type: String,  
            required: true  
        },  
        public_id: {  
            type: String,  
            required: true  
        }  
    }  
});