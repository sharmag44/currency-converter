import { convertCurrency, formatCurrency } from '../src/index';

async function simpleIntegrationDemo() {
  console.debug('--- Simple Integration Demo ---');
  console.debug('Converting 100 USD to EUR using a single function call...\n');

  try {
    // No need to create a class or close anything - handled automatically!
    const result = await convertCurrency('USD', 'JPY', 100);

    console.info(`Success!`);
    console.info(`Amount: ${formatCurrency(result.amount, result.from)}`);
    console.info(`Result: ${formatCurrency(result.result, result.to)}`);
    console.info(`Rate: ${result.rate}`);
    console.info(`Source: ${result.source}`);
    console.info(`Timestamp: ${result.timestamp}`);

  } catch (error: any) {
    console.error('Error during conversion:', error.message);
    if (error.debugInfo) {
      console.error('\n--- Debug Info ---');
      console.error('URL Attempted:', error.debugInfo.url);
      console.error('Methods Attempted:', error.debugInfo.methodAttempted?.join(', ') || 'None');
      console.error('HTML Snippet:', error.debugInfo.htmlSnippet);
    }
  }
}

// Run the demo
simpleIntegrationDemo();
