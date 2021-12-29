require('dotenv').config()
const fs = require('fs'),
BigCommerce = require('node-bigcommerce'),
bigCommerce = new BigCommerce({
    storeHash: process.env.BC_STORE_HASH,
    clientId: process.env.BC_CLIENT_ID,
    accessToken: process.env.BC_API_KEY,
    responseType: 'json',
    apiVersion: 'v3'
}),
productsLimit = process.env.PRODUCTS_LIMIT,
valuesPerOption = process.env.VALUES_PER_OPTION,
timestamp = Date.now(),
initialValues = [1, 1, 1, 1, 1, 1],
results = []

const incrementValues = values => {
    let incremented = false
    for (let i = values.length - 1; i >= 0; i-- ) {
        if (values[i] < valuesPerOption) {
            if(!incremented) {
                values[i]++
                incremented = true
            }
            break
        } else {
            values[i] = 1
        }
    }
    return values
}

const recursivelyCreateVariants = (values, productIteration, variants = [], iteration = 1) => {
    const optionValues = values.map((value, i) => ({
        option_display_name: `option-${i + 1}`,
        label: value.toString()
    }))
    const variant = {
        sku: `sku-${timestamp}-${productIteration}-${iteration}`,
        option_values: optionValues
    }
    variants.push(variant)
    iteration++
    values = incrementValues(values)
    if (iteration > values.length * valuesPerOption)
        return variants
    else
        return recursivelyCreateVariants(values, productIteration, variants, iteration)
}
const job = async () => {
    for (let i = 1; i <= productsLimit; i++) {
        console.log(`Creating product ${i} of ${productsLimit}...`)
        const product = {
            name: `complex product - ${timestamp}-${i}`,
            type: 'physical',
            price: '1000',
            weight: '1',
            variants: recursivelyCreateVariants(initialValues, i)
        }

        await bigCommerce.post('/catalog/products', product)
        .then(responseBody =>  {
            results.push(responseBody)
        })
        .catch(err => {
            console.error(err)
            results.push(err)
        })

        fs.writeFileSync('results.json', JSON.stringify(results, null, 2))
    }

    console.log(`Finished`)
}

job()

