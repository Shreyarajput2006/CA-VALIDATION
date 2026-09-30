function validatePAN(value){

    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    return regex.test(value);

}


