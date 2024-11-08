// 运行在 Electron 渲染进程 下的页面脚本

import {pluginLog} from "./utils/frontLog.js";
import {listenMenu} from "./utils/rightClickMenu.js";
import {getRandomInt} from "./utils/math.js";
const pluginAPI = window.stick_emoji
await onLoad();//注入

// 打开设置界面时触发
export const onSettingWindowCreated = view => {
    // view 为 Element 对象，修改将同步到插件设置界面
}

async function onLoad() {
    if (location.hash === "#/blank") {
        navigation.addEventListener("navigatesuccess", onHashUpdate, {once: true});
    } else {
        await onHashUpdate();
    }

    pluginLog('onLoad函数加载完成')
}

async function onHashUpdate() {
    const hash = location.hash;
    if (hash === '#/blank') return
    if (!(hash.includes("#/main/message") || hash.includes("#/chat"))) return;//不符合条件直接返回

    pluginLog('执行onHashUpdate')
    //"nodeIKernelMsgListener/onAddSendMsg"
    //"nodeIKernelMsgListener/onRecvMsg"
    try {

        listener = pluginAPI.subscribeEvent("nodeIKernelMsgListener/onAddSendMsg", async (payload) => {
            //console.log(payload)
            const config=await pluginAPI.getConfig()
            if(!config.isStickSelf) return //没开贴自己表情，就直接返回

            let sendCount = 0
            const taskID = setInterval(async () => {
                const msgSeq = String(parseInt(payload.msgRecord.msgSeq) + 1)//发出去后，msgSeq会+1
                const chatType = payload.msgRecord.chatType
                const peerUid = payload.msgRecord.peerUid

                const result = await pluginAPI.invokeNative("ns-ntApi", "nodeIKernelMsgService/setMsgEmojiLikes", false, {
                    "peer": {"chatType": chatType, "peerUid": peerUid, "guildId": ""},
                    "emojiId": String(getRandomInt(1,10000)),
                    "emojiType": "1",
                    "msgSeq": msgSeq,
                    "setEmoji": true
                }, null)


                if (result.result !== 0 && sendCount < 5) {
                    sendCount++
                } else {//说明重试次数超了或者成功发送
                    clearInterval(taskID)
                }

                console.log(result)
                //pluginLog(msgSeq)
            }, 500)//这里要延时发，不然会报错{"result": 65018,"errMsg": "群消息不存在"}

        })
        listenMenu()
        pluginLog("事件监听成功")

        //尝试获取群列表


    } catch (e) {
        console.log(e)
    }
}
