import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema({

}, {timestamps: true})


export const MedRecord = new mongoose.model("MedRecord", medicalRecordSchema);