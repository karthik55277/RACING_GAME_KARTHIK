import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RacingGame from './RacingGame.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><RacingGame /></StrictMode>);
