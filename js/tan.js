function validateTAN(value){

    const regex = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

    return regex.test(value);

}