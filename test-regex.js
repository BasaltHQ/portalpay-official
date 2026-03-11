const tests = [
  '["Nallon síne","Nallon síne","Namarie," "Orcasin,"]',
  '["A", "B" \n "C"]',
  '["Naur aned," "Voron lumb," "Namarie"]',
  '["Hello"  "World"]'
];

for (const raw of tests) {
  const fixed = raw.replace(/"\s+"/g, '", "');
  try {
    JSON.parse(fixed);
    console.log("SUCCESS:", fixed);
  } catch(e) {
    console.log("FAIL:", fixed);
  }
}
