function validateAadhaar(value){

    const regex = /^\d{12}$/;

    return regex.test(value);

}