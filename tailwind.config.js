/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                playfair: ['"Playfair Display"', 'serif'],
            },
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                },
            }
        },
    },
    plugins: [],
}
