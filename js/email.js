function validateEmail(value){

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(value);

}