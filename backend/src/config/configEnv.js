import path from "path";
import dotenv from 'dotenv';
import argon2 from 'argon2';
import { fileURLToPath } from "url";

// Configuración para que sepa dónde estan las variables de entorno
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
const envFilePath = path.resolve(_dirname, ".env");
dotenv.config({ path: envFilePath })

// SERVER
export const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
    throw new Error("NODE_ENV is not defined");
}
export const PORT = process.env.PORT;
if (!PORT) {
    throw new Error("PORT is not defined");
}
// DATABASE
export const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}
// SECRET KEY
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}
// ARGON2 CONFIGURATION
export const ARGON2_TYPE = argon2[process.env.ARGON2_TYPE];
if (!ARGON2_TYPE) {
    throw new Error("ARGON2_TYPE is not defined");
}
export const ARGON2_MEMORY_COST = parseInt(process.env.ARGON2_MEMORY_COST, 10);
if (!ARGON2_MEMORY_COST) {
    throw new Error("ARGON2_MEMORY_COST is not defined");
}
export const ARGON2_TIME_COST = parseInt(process.env.ARGON2_TIME_COST, 10);
if (!ARGON2_TIME_COST) {
    throw new Error("ARGON2_TIME_COST is not defined");
}
export const ARGON2_PARALLELISM = parseInt(process.env.ARGON2_PARALLELISM, 10);
if (!ARGON2_PARALLELISM) {
    throw new Error("ARGON2_PARALLELISM is not defined");
}
// FRONTEND
export const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not defined");
}