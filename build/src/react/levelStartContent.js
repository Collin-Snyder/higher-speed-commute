import React, { useContext, useEffect } from "react";
import { ModalInputContext } from "./modalInputContext";
const LevelStartContent = () => {
    let [, dispatch] = useContext(ModalInputContext);
    useEffect(() => {
        dispatch({
            type: "SET_SUBMIT_FUNC",
            payload: function (e) {
                var _a;
                //@ts-ignore
                let buttonId = (_a = e.target) === null || _a === void 0 ? void 0 : _a.id;
                let difficulty = buttonId.match(/(?<=play)(.+)(?=-)/)[0].toLowerCase();
                window.game.setDifficulty(difficulty);
                console.log("Chosen difficulty: ", difficulty);
                window.game.publish("startingAnimation");
            },
        });
    }, []);
    return (React.createElement("div", { id: "level-start-content" },
        React.createElement("h3", null, "Select playing difficulty to start")));
};
export default LevelStartContent;
