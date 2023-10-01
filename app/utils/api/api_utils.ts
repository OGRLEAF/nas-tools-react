export const objectToFormData = function(obj:any, formData:undefined|FormData=undefined, namespace:undefined|string='') {
    
    var fd = formData || new FormData();
    var formKey;
    
    for(var property in obj) {
      if(obj.hasOwnProperty(property)) {
        
        if(namespace) {
          formKey = namespace + '[' + property + ']';
        } else {
          formKey = property;
        }
       
        // if the property is an object, but not a File,
        // use recursivity.
        if(typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
          
          objectToFormData(obj[property], fd, property);
          
        } else {
          
          // if it's a string or a File object
          fd.append(formKey, obj[property]);
        }
        
      }
    }
    
    return fd;
      
  };