import express from "express";
import dotenv from "dotenv";
// import cors from "cors";  
// import { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// app.use(cors());

app.use(express.json());

const MONGO_URL = process.env.MONGO_URL;

async function createConnection(){
    const client =  new MongoClient(MONGO_URL) 
    client.connect();  
    console.log("Mongodb Connected");
    return client;
}
const client = await createConnection();

app.get("/",(request,response)=>{
    response.send("hello happy world");
});

async function createUser(data) {
	return await client.db("b28wd").collection("password").insertOne(data);
}

async function getUserByName(email) {
	return await client
		.db("b28wd")
		.collection("password")
		.findOne({ email: email });
}



async function genPassword(password){
	const NO_OF_ROUNDS = 10;
	const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
	console.log(salt);
	const hashedPassword = await bcrypt.hash(password, salt);
	console.log(hashedPassword);
	return hashedPassword;
}


app.post("/signup", async (request,response)=>{
	const {email, password} = request.body;
	const userFromDB = await getUserByName(email);
console.log(userFromDB);

if(userFromDB){
	response.status(400).send({message: "email already exists"});
	return;
}

if(password.length < 8){
	response.status(400).send({message: "password must be longer"});
	return;
}


	const hashedPassword = await genPassword(password); 
	const result = await createUser({ email, password:hashedPassword });
	response.send(result);   
	});

app.post("/login", async (request,response)=>{
	const {email, password} = request.body;
	const userFromDB = await getUserByName(email);

	if(!userFromDB){
		response.status(401).send({message: "Invalid Credentials"});
		return;
	}

	const storedPassword = userFromDB.password;
	console.log(storedPassword);

	const isPasswordMatch = await bcrypt.compare(password, storedPassword);

	console.log(isPasswordMatch);
	console.log(userFromDB);

	if (isPasswordMatch) {
		
		response.send({message: "sucessful login"});
	}else{
		response.status(401).send({message: "Invalid Credentials"});
	}

	
});

app.listen(PORT,()=>console.log("app is started in",PORT));