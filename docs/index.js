const fs = require('fs')
const path = require('path')

const resolve = dirname => path.resolve(__dirname, dirname)

/**
 * 是否存在目录
 * @param {*} docsPath
 * @returns
 */
const isExitFirDir = docsPath => fs.existsSync(docsPath)

/**
 *  传入一个目录，递归遍历出目录里面所有子文件的路径
 * @param {*} dir 
 * @returns 
 */
const getFiles = (dir, excludeDir) => {
    const files = fs.readdirSync(dir)
    const result = []
    files.forEach(file => {
        // 排除掉一些文件夹
        if (excludeDir && file === excludeDir) return
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            result.push(...getFiles(filePath))
        } else {
            result.push(filePath)
        }
    })
    return result
}


const generateSidebarJson = () => {
    // 递归读取docs目录下面所有的文件夹，形成文件夹链条
    const docsPath = resolve('../docs')
    const files = getFiles(docsPath, '.vitepress')
    // 排除掉不是以.md结尾的文件
    const res = files.filter(item => item.endsWith('.md')).map(item => {
        let name = item.replace(docsPath, '');
        // 以\\转成/
        name = name.replace(/\\/g, '/').replace('/', '');
        let nameArr = name.split('/');
        // 如果nameArr长度为1
        if (nameArr.length === 1) {
            return {
                "text": '首页',
                "link": name
            }
        } else {
            return {
                "text": nameArr[0],
                "collapsed": true,
                "items": [
                    {
                        "text": nameArr[1],
                        "link": name
                    }
                ]
            }

        }
    })

    // 合并res中text相同的对象
    const sidebarJson = res.reduce((acc, cur) => {
        const index = acc.findIndex(item => item.text === cur.text);
        if (index !== -1) {
            acc[index].items = acc[index].items.concat(cur.items || []);
        } else {
            acc.push(cur);
        }
        return acc;
    }, []);
    // 把sidebarJson写入到slidebar.json文件当中
    fs.writeFileSync(resolve('./slidebar.json'), JSON.stringify(sidebarJson, null, 2));
}

generateSidebarJson()


