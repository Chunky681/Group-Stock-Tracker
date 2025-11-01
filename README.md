# Group Stock Tracker

A beautiful, real-time stock portfolio tracker for families and small groups. Built with React, Vite, and integrated with Google Sheets for collaborative data storage.

![Group Stock Tracker](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.6-38B2AC?logo=tailwind-css)

## Features

- 🔍 **Real-time Stock Search** - Search and find stock tickers instantly
- 💹 **Live Stock Prices** - Get real-time stock quotes from Yahoo Finance
- 👥 **Multi-User Support** - Track stocks for multiple family members
- 📊 **Portfolio Overview** - View total portfolio value and individual holdings
- 💾 **Google Sheets Integration** - All data stored in Google Sheets (acts like a CSV)
- ✨ **Beautiful UI** - Modern, responsive design with smooth animations
- 🔄 **Auto-Refresh** - Update stock prices on demand

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Google Sheets Setup

Since this is a static site on GitHub Pages, you'll need to use Google Sheets API to store data. Follow these steps:

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API** and **Google Drive API**

#### Step 2: Create a Service Account
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Name it (e.g., "stock-tracker") and create it
4. Click on the service account, go to **Keys** tab
5. Click **Add Key** > **Create new key** > Choose **JSON**
6. Download the JSON file (you'll need this)

#### Step 3: Create and Share Google Sheet
1. Create a new Google Sheet
2. Share it with the service account email (found in the JSON file, looks like `your-service-account@project-id.iam.gserviceaccount.com`)
3. Give it **Editor** permissions
4. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)

#### Step 4: Get API Key (Alternative Method)
If you prefer using an API key instead of service account:
1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Restrict the API key to **Google Sheets API** only (for security)
4. Copy the API key

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
```

**Important:** For GitHub Pages deployment, you'll need to add these as GitHub Secrets:
1. Go to your repository **Settings** > **Secrets and variables** > **Actions**
2. Add `VITE_GOOGLE_SHEETS_API_KEY` and `VITE_GOOGLE_SHEET_ID` as secrets
3. The workflow will use these during build

### 4. Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy to GitHub Pages

1. Push your code to the `main` branch
2. Go to repository **Settings** > **Pages**
3. Set source to **GitHub Actions**
4. The workflow will automatically deploy when you push to main

## Usage

1. **Search for a Stock**: Type a ticker symbol (e.g., AAPL, MSFT, GOOGL) in the search box
2. **Select a Stock**: Click on a search result to see real-time price data
3. **Add to Portfolio**: Enter your username and number of shares, then click "Add to Portfolio"
4. **View Portfolio**: See all holdings grouped by ticker with total values
5. **Edit Entries**: Click the edit icon next to any entry to modify username or shares
6. **Refresh Prices**: Click "Refresh Prices" to update all stock prices

## Data Structure

The Google Sheet stores data in the following format:

| Username | Ticker | Shares | Last Updated |
|----------|--------|--------|--------------|
| John     | AAPL   | 10     | 2024-01-15...|
| Jane     | MSFT   | 5      | 2024-01-15...|

## Stock API

This app uses the Yahoo Finance API (free, no API key required) for stock data. If you need more reliability or features, you can:

- **Alpha Vantage**: Free tier available, requires API key
- **Polygon.io**: Free tier available, requires API key
- **IEX Cloud**: Free tier available, requires API key

To switch APIs, modify `src/utils/stockApi.js`.

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Axios** - HTTP requests (for future API integrations)

## Security Notes

- API keys are exposed in the frontend code for Google Sheets API
- Consider using a proxy/backend service for production use with sensitive data
- Google Sheets API has rate limits (read the docs for current limits)
- For added security, restrict API keys to specific domains/IPs in Google Cloud Console

## License

MIT License - feel free to use this project for your family!

## Support

If you encounter any issues:
1. Check that your Google Sheets API key is valid
2. Verify the Sheet ID is correct
3. Ensure the service account has Editor access to the sheet
4. Check browser console for detailed error messages

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
