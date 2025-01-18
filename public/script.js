document.addEventListener('DOMContentLoaded', () => {
	const textInput = document.getElementById('textInput');
	const saveButton = document.getElementById('saveButton');
	const entryList = document.getElementById('entryList');

	// Load entries
	async function loadEntries() {
		const response = await fetch('/api/entries');
		const entries = await response.json();
		entryList.innerHTML = entries
			.map(entry => `<li><strong>${new Date(entry.date).toLocaleString()}:</strong> ${entry.text}</li>`)
			.join('');
	}

	// Save entry
	saveButton.addEventListener('click', async () => {
		const text = textInput.value.trim();
		if (!text) return;

		await fetch('/api/entries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text }),
		});

		textInput.value = '';
		loadEntries();
	});

	loadEntries();
});
