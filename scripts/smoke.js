import { buildHistory } from '../src/prompts.js';
import { generate, shutdown } from '../src/engine.js';
let output = '';
try {
  for await (const token of generate(buildHistory({ notes: 'Lift is the aerodynamic force perpendicular to the relative airflow. Drag acts parallel to the airflow. Ailerons control roll. The elevator controls pitch. The rudder controls yaw.', mode: 'guide' }))) {
    output += token;
    process.stdout.write(token);
  }
  if (output.trim().length < 30) throw new Error('Inference returned insufficient output.');
  console.log('\nReal QVAC inference completed.');
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await shutdown(); }
