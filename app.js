//const express = require('express');
//const bodyParser = require('body-parser');
//const fs = require('fs');
//const { v4: uuidv4 } = require('uuid'); // Unique ID generator
//const path = require('path');
//const { default: PQueue } = require('p-queue');

import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import PQueue from 'p-queue';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const queue = new PQueue({ concurrency: 1 }); // Ensure one write at a time

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Load data from file
async function loadData() {
	if (!fs.existsSync(DATA_FILE)) return [];
	const data = await fs.promises.readFile(DATA_FILE, 'utf-8');
	return JSON.parse(data);
}

async function saveData(data) {
	await queue.add(() => fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2)));
}

// API Routes
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // Sends a "No Content" status
});

app.get('/api/entries', async (req, res) => {
	const data = await loadData();
	res.json(data);
});

app.delete('/api/entries/:id', async (req, res) => {
	const id = req.params.id;
	let entries = await loadData();

	const entryIndex = entries.findIndex(entry => entry.id === id);
	if (entryIndex === -1) {
		return res.status(404).json({ error: 'Entry not found' });
	}

	// Remove entry
	entries.splice(entryIndex, 1);
	await saveData(entries);

	res.status(200).json({ message: 'Entry deleted successfully' });
});

app.post('/api/entries', async (req, res) => {
	const { text } = req.body;
	if (!text) return res.status(400).json({ error: 'Text is required' });

	const data = await loadData();

	// Check for duplicates
	const duplicateIndex = data.findIndex(entry => entry.text === text);
	if (duplicateIndex !== -1) {
		return res.status(200).json({
			success: false,
			reason: 'Duplicate entry',
			index: duplicateIndex,
			existingId: data[duplicateIndex].id,
		});
	}

	const entry = {
		id: uuidv4(),
		text,
		date: new Date().toISOString(),
	};

	data.unshift(entry);
	await saveData(data);

	res.json({
		success: true,
		entry
	});
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
