/*
 * @Author: 卓文理
 * @Email: 531840344@qq.com
 * @Date: 2018-01-18 14:52:13
 */

'use strict';

import axios from 'axios';
// import cookie from './cookie';

// const auths = {};

/**
 * XMLHttpRequest 封装
 * @export
 * @param {Object} [query={}] 请求参数
 * @returns Promise
 */
export function fetch(query = {}) {
    const params = Object.assign({}, query);

    if (params.method === 'get') {
        params.params = params.data;
        delete params.data;
    }

    params.headers = Object.assign(params.headers, {
        'Content-Type': 'application/json'
    });
    params.validateStatus = status => (status >= 200 && status < 500);

    // console.log('=========== FETCH START ===========');
    // console.log(params);
    return axios(params)
        .then((res) => {
            const { data, status } = res;

            if (status >= 400) {
                return Promise.reject(res);
            }

            // console.log(res, data);
            // console.log('=========== FETCH END ===========');
            return data;
        })
        .catch((error) => {
            const proxy = {};

            proxy.name = '接口请求异常';
            proxy.message = error.message;

            if (error.data) {
                return Promise.reject(error.data);
            }

            return Promise.reject(proxy);
        });
}

/**
 * http get 请求简单封装
 * @export
 * @param {String} url 请求的URL
 * @param {Object} [data={}] 请求参数
 * @param {Object} [data={}] 请求头
 * @returns Promise
 */
export function get(url, data = {}, headers = {}) {
    return fetch({
        url, data, method: 'get', headers
    });
}

/**
 * http post 请求简单封装
 * @export
 * @param {String} url 请求的URL
 * @param {Object} [data={}] 请求参数
 * @param {Object} [data={}] 请求头
 * @returns Promise
 */
export function post(url, data = {}, headers = {}) {
    return fetch({
        url, data, method: 'post', headers
    });
}

/**
 * http delete 请求简单封装
 * @export
 * @param {String} url 请求的URL
 * @param {Object} [data={}] 请求参数
 * @param {Object} [data={}] 请求头
 * @returns Promise
 */
export function del(url, data = {}, headers = {}) {
    return fetch({
        url, data, method: 'delete', headers
    });
}

/**
 * http put 请求简单封装
 * @export
 * @param {String} url 请求的URL
 * @param {Object} [data={}] 请求参数
 * @param {Object} [data={}] 请求头
 * @returns Promise
 */
export function put(url, data = {}, headers = {}) {
    return fetch({
        url, data, method: 'put', headers
    });
}


/**
 * http jsonp 请求简单封装
 *
 * @export
 * @param {String} url 请求的URL
 * @param {Object} [query={}] 请求参数
 * @returns {Promise}
 */
export function jsonp(url, query = {}) {
    return axios({
        url,
        params: {
            ...query,
            cb: 'callback',
            t: (new Date()).getTime()
        },
        method: 'get',
        responseType: 'text',
        headers: {}
    }).then(res => {
        const data = {};
        // 替换eval实现，使用正则提取JSON数据
        const jsonMatch = res.match(/callback\((\{.*?\})\)/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error('Failed to parse JSONP response', e);
                return data;
            }
        }
        return data;
    });
}

export default {
    fetch, get, put, delete: del, post, jsonp
};

