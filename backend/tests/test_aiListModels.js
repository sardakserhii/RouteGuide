(async () => {
    const axios = require("axios");
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    try {
        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );

        // Выведите в консоль, чтобы увидеть точные имена:
        console.log(response.data.models.map((m) => m.name));
        // Вы увидите что-то вроде: "models/gemini-1.5-flash", "models/gemini-2.5-flash", и т.д.
    } catch (error) {
        console.error(
            "Error listing models:",
            error.response ? error.response.data : error.message
        );
    }
})();
