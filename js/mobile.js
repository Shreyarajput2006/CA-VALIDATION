function validateMobile(value){

    const regex = /^[6-9]\d{9}$/;

    return regex.test(value);

}