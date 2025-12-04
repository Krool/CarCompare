const data = require('../src/data/cars.json');

// Check cars that have autoFoldingMirrors set to false
const hasFalse = data.cars.filter(c => c.adasFeatures && c.adasFeatures.autoFoldingMirrors === false);
console.log('Cars with autoFoldingMirrors = false:');
hasFalse.forEach(car => {
  console.log(car.id, '-', car.make, car.model, car.year, car.trim || '');
});
console.log('\nTotal with false:', hasFalse.length);

console.log('\n--- Summary ---');
const hasTrue = data.cars.filter(c => c.adasFeatures && c.adasFeatures.autoFoldingMirrors === true);
console.log('Cars with autoFoldingMirrors = true:', hasTrue.length);
console.log('Cars with autoFoldingMirrors = false:', hasFalse.length);
console.log('Total cars:', data.cars.length);
