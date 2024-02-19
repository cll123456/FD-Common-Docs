> 热力图渐变效果是很常见的，主要用于表达一个区域的热力情况`（useHeatMap）`

## 效果

![alt text](1.gif)

## 源码

```ts
const layerTreeObject: any = {}

/**
 * 拆楼hooks
 * @param location 楼宇当前的位置
 * @param houseName  楼宇的名称数组
 * @param height 打开楼宇楼之间的空隙
 * @param rotation 楼宇的方向，传入一个角度，默认90，范围是[0-360]
 * @param distance 楼宇抽出来的距离，默认是30
 * @returns
 */
export async function useHouse(location: number[], houseName: string[], height: number = 10, rotation: number = 90, distance = 30) {
    // 通过图层的名字，获取图层的ID
    if (!Object.keys(layerTreeObject).length) {
        const res: any = await __g.infoTree.get()
        // 图层树
        res.infotree.forEach((item: any) => {
            layerTreeObject[item.name] = item.iD
        })
    }
    // 楼层ID
    const layerIds: { id: string; isOpen: boolean; index: number }[] = []
    for (let index = 0; index < houseName.length; index++) {
        if (!layerTreeObject[houseName[index]]) {
            throw Error('当前图层名称有问题!!!')
        } else {
            layerIds.push({ id: layerTreeObject[houseName[index]], isOpen: false, index: index })
        }
    }

    // 获取移动的目标点位
    const goalPoint = getPosition(distance)[rotation]

    // 是否打开
    let isOpen = false

    /**
     * 打开楼层
     */
    const open = async () => {
        isOpen = true
        // 把楼宇打开,除了第一层外，其他的每一层都需要向上移动height x 层数
        const time = 20

        __g.tileLayer.updateBegin()
        for (let t = 1; t <= time; t++) {
            for (let index = 0; index < layerIds.length; index++) {
                // 每一层
                const perHeight = (height * index) / time
                const perHouse = layerIds[index].id
                __g.tileLayer.setLocation(perHouse, [location[0], location[1], location[2] + perHeight * t], null)
            }
        }
        __g.tileLayer.updateEnd()
    }

    /**
     * 关闭楼层
     */
    const close = () => {
        isOpen = false
        // 把楼宇打开,除了第一层外，其他的每一层都需要向上移动height
        const time = 20
        __g.tileLayer.updateBegin()
        for (let t = 1; t <= time; t++) {
            for (let index = 0; index < layerIds.length; index++) {
                // 每一层
                const perHeight = (height * index) / time
                const perHouse = layerIds[index].id
                __g.tileLayer.setLocation(perHouse, [location[0], location[1], location[2] + perHeight * (time - t)], null)
            }
        }
        __g.tileLayer.updateEnd()
    }

    /**
     * 显示隐藏楼层
     * @param t
     */
    const showHouse = async (t: number, fn: () => void) => {
        // 显示所有楼层，然后隐藏
        for (let index = 0; index < layerIds.length; index++) {
            const perHouse = layerIds[index].id
            await __g.tileLayer.setLocation(perHouse, location, null)
        }
        // 显示
        let ids = JSON.parse(JSON.stringify(layerIds)).map((p: { id: string; isOpen: boolean }) => p.id)
        await __g.tileLayer.show(ids)
        await __g.tileLayer.hide(JSON.parse(JSON.stringify(ids)).splice(t, ids.length))
    }

    /**
     * 根据当前坐标，获取一个半径为r的圆圈
     * @param r
     * @returns
     */
    function getPosition(r: number) {
        var pointArr = []
        for (var i = 0; i < 360; i++) {
            //角度转弧度
            var radians = (i * Math.PI) / 180
            //计算圆上的点X坐标
            var x1 = location[0] + r * Math.cos(radians)
            //计算圆上的点Y坐标
            var y1 = location[1] + r * Math.sin(radians)
            //赋值圆上所有点数组
            pointArr.push([x1, y1])
        }

        return pointArr
    }

    /**
     * 移动楼层
     * @param floor
     */
    const moveHouse = (floor: number) => {
        if (!isOpen) {
            throw Error('楼宇没有打开，不能移动楼层！！！')
            return
        }
        let time = 20
        let perX = (location[0] - goalPoint[0]) / time
        let perY = (location[1] - goalPoint[1]) / time

        const isRestFloor = layerIds.filter(f => f.isOpen)
        // 存在需要抽回的楼层，抽回楼层
        if (isRestFloor.length) {
            const currentHeight = height * isRestFloor[0].index
            // 重置楼层
            __g.tileLayer.updateBegin()
            for (let index = 1; index <= time; index++) {
                __g.tileLayer.setLocation(isRestFloor[0].id, [location[0] + perX * (time - index), location[1] + perY * (time - index), location[2] + currentHeight])
            }
            __g.tileLayer.updateEnd()
            isRestFloor[0].isOpen = false
            // 如果是同一层，直接关闭
            if (floor - 1 === isRestFloor[0].index) {
                return
            }
        }

        if (!layerIds[floor - 1].isOpen) {
            layerIds[floor - 1].isOpen = true
            const currentHeight = height * (floor - 1)
            __g.tileLayer.updateBegin()
            for (let index = 1; index <= time; index++) {
                __g.tileLayer.setLocation(layerIds[floor - 1].id, [location[0] + perX * index, location[1] + perY * index, location[2] + currentHeight])
            }
            __g.tileLayer.updateEnd()
        }
    }

    return {
        open,
        close,
        showHouse,
        moveHouse,
        isOpen
    }
}
```

## 使用方式

```ts
<template>
    <div class="open-or-close">
        <div class="title" @click="handlerOpen">
            <span>{{ title }}</span>
        </div>
        <transition name="custom-classes-transition" enter-active-class="animate__animated animate__zoomIn" leave-active-class="animate__animated animate__zoomOut">
            <div class="floors" v-if="isOpen">
                <div class="floor" @click="handlerFloorClick(item)" v-for="item in 7">{{ item }}</div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import {useHouse} from './useHouse'

const isOpen = ref(false)

const title = computed(() => (isOpen.value ? '收起' : '展开'))

let house: any = null
const handlerOpen =async () => {
     house = await useHouse(['楼宇名称1','楼宇名称2','楼宇名称3'], [0,0,0])
    if(!isOpen.value && house){
        house.open()
    }else{
        house.close()
    }
}

const handlerFloorClick = async (item: number) => {
    if(house){
        house.moveHouse(item)
    }
}

onBeforeUnmount(() => {
    if(house && isOpen.value){
        house.close()
    }

})
</script>

<style lang="scss" scoped>
.open-or-close {
    position: fixed;
    @include Top(50);
    @include Right(500);
    z-index: 110;
    .title {
        position: relative;
        @include Width(150);
        text-align: center;
        @include hHeight(100);
        @include MarginBottom(10);
        background: url('./building_tag_bg.png') no-repeat center;
        background-size: contain;
        span {
            position: absolute;
            @include Top(45);
            @include Left(80);
        }
    }
    .floors {
        position: absolute;
        @include Top(90);
        @include Left(30);
        display: flex;
        flex-direction: column-reverse;
        justify-content: space-around;
        align-items: center;
        @include Width(100);
        @include hHeight(250);
        background: linear-gradient(rgba(53, 75, 91, 0.8), rgba(53, 75, 91, 0.6), rgba(53, 75, 91, 0.3));

        .floor {
            @include Padding(5, 0, 5, 0);
            text-align: center;
            width: 100%;
            border: 1px solid #fff;
            &:hover {
                background: rgba(95, 193, 243, 1);
            }
        }
    }
}
</style>

```

## 用到的资源

### ui 图片

![uilding_tag_bg](building_tag_bg.png)
