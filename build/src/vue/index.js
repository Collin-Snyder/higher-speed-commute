"use strict";
let vm = new Vue({
    el: "#test-vue",
    data: {
        message: `This message is being read at ${new Date().toLocaleString()}!`,
    },
});
