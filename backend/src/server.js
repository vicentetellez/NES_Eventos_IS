import app from './app.js';
import { PORT } from './config/configEnv.js';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
