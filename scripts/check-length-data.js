const data = require('../src/data/cars.json');

const carsWithLength = data.cars.filter(c => c.lengthInches);
const carsWithout = data.cars.filter(c => !c.lengthInches);

console.log('Cars with lengthInches:', carsWithLength.length);
console.log('Cars without lengthInches:', carsWithout.length);

if (carsWithout.length > 0 && carsWithout.length <= 30) {
  console.log('\nMissing length data:');
  carsWithout.forEach(c => {
    console.log(`  - ${c.year} ${c.make} ${c.model} (${c.id})`);
  });
}
