> 对于一些需要实现内网**网络，供水，供电**等的路径管道效果，可以使用该方法

## 效果

![alt text](image.png)

## 源码

```ts
//添加地铁线
const addLine = async () => {
    let polylineArr: any = []
    let arr: any = []

    //TODO 获取地铁数据,这里需要发送请求
    const res = await getSubwayLine()
    const oneLineData = res.data.features.map((p: any, i: number) => p.geometry.coordinates[0].map((p: any, index: number) => [p[0], p[1], 810]))

    // 分多少次来画线
    let nums = 33

    //  有多少个点，我就画几次
    let i = 0,
        nextI = 1
    let deleteArr: any = []
    for (; i <= nums - 1; ) {
        let arr: any = []
        for (let item = 0; item < oneLineData.length; item++) {
            if (oneLineData[item][nextI + 1]) {
                deleteArr.push('p2' + i + item)
            }
            let p2 = {
                id: 'p2' + i + item, //折线唯一标识id
                coordinates: JSON.parse(JSON.stringify(oneLineData[item])).splice(0, nextI), //构成折线的坐标点数组
                coordinateType: 0, //坐标系类型，取值范围：0为Projection类型，1为WGS84类型，2为火星坐标系(GCJ02)，3为百度坐标系(BD09)，默认值：0
                range: [1, 100000000000], //可视范围：[近裁距离, 远裁距离]，取值范围: [任意负值, 任意正值]
                color: colorLists[item], //折线颜色
                thickness: 400, //折线宽度
                intensity: 0.1, //亮度
                flowRate: 0.5, //流速
                shape: 1, //折线类型 0：直线， 1：曲线
                depthTest: false, //是否做深度检测 开启后会被地形高度遮挡
                style: 4, //折线样式 参考样式枚举：PolylineStyle
                tiling: 0 //材质贴图平铺比例
            }
            arr.push(p2)
        }

        await __g.polyline.add(arr)
        await delay(40)
        i++
        nextI++
    }

    __g.polyline.delete(deleteArr)
}

/**
 * 延迟函数
 */
const delay = (n: number) => {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
            clearTimeout(t)
            resolve(true)
        }, n)
    })
}
```

## 使用方法

```ts
await delay(2500)
addLine()
await delay(4000)
```

## 注意事项

要保证线可以直的往上走，线需要确保`x,y` 是一致的，只需要改变`z`值就行
