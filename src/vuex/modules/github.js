/*
 * @Author: 卓文理
 * @Email: 531840344@qq.com
 * @Date: 2018-01-18 10:53:12
 */

'use strict';

import Promise from 'bluebird';
import { get } from '../../services/fetch';
import * as types from '../types';
import storage from '../../services/storage';

const time = new Date();
const year = new Date(time.getFullYear(), 0, 1);
const toDay = time.getDate();
const toWeek = Math.ceil((((new Date() - year) / 86400000) + year.getDay() + 1) / 7);
const toMonth = time.getMonth() + 1;

const fetchTrendingRepos = async (lang, since, type = 'repositories') => {
    console.log(lang);
    const data = await get(`https://gtrend.infly.io/${type}?language=${encodeURIComponent(lang)}&since=${since}`);

    if (type === 'developers' && lang === 'JavaScript' && (Math.random() * 2) > 1) {
        data.push({
            avatar: 'https://avatars3.githubusercontent.com/u/9620783?s=96&v=4',
            author: '卓文理',
            url: 'https://github.com/zhuowenli',
            username: 'zhuowenli',
            repo: {
                name: 'githuber',
                url: 'https://github.com/zhuowenli/githuber',
                description: ':octocat: Display Github Trending repositories on New Tab Extensions',
            }
        });
    }

    return data;
};

export const getters = {
    trendings: state => state.trendings,
    lastQuery: state => state.lastQuery || {}
};

export const actions = {
    /**
     * 获取GitHub Trending
     *
     * @param {any} { commit } state
     * @param {Object} [query={}] 请求参数
     * @param {String} query.since 时间维度：daily、weekly、monthly
     * @param {String} query.lang 语言
     * @param {String} query.type repositories、developers
     * @returns {Promise}
     */
    async fetchTrending ({ commit, state }, query = {}) {
        // 确保query中有必要的属性
        query = {
            lang: [],
            since: 'weekly',
            type: 'repositories',
            ...query
        };

        // 保存最后的查询，用于刷新
        commit(types.SET_LAST_QUERY, query);

        const data = await storage.getItem(JSON.stringify(query));

        if (
            data && data.repos && data.repos.length && (
                (query.since === 'daily' && data.toDay === toDay) ||
                (query.since === 'weekly' && data.toWeek === toWeek) ||
                (query.since === 'monthly' && data.toMonth === toMonth)
            )
        ) {
            commit(types.RECEIVE_GITHUB_TRENDINGS, data.repos);
            return data.repos;
        }

        const { since, type } = query;

        let repos = [];
        let isAllLanguage = false;

        // 安全地检查query.lang
        if (Array.isArray(query.lang) && query.lang.length) {
            query.lang.forEach(item => {
                if (item === '') isAllLanguage = true;
            });
        } else {
            // 如果query.lang不是数组或为空，设置为全部语言
            isAllLanguage = true;
        }

        if (isAllLanguage) {
            repos = await fetchTrendingRepos('', since, type);
        } else {
            await Promise.map(query.lang, async lang => {
                const res = await fetchTrendingRepos(lang, since, type);
                repos = repos.concat(res);
                return res;
            });
            repos = repos.sort((a, b) => (+b.added - a.added));
        }

        commit(types.RECEIVE_GITHUB_TRENDINGS, repos);

        storage.setItem(JSON.stringify(query), {
            repos,
            toDay,
            toWeek,
            toMonth
        });

        return repos;
    },

};

export const mutations = {
    [types.RECEIVE_GITHUB_TRENDINGS](state, data) {
        state.trendings = data;
    },
    [types.SET_LAST_QUERY](state, query) {
        state.lastQuery = query;
    }
};

export default {
    actions,
    getters,
    mutations,
    namespaced: true,
    state: {
        trendings: [],
        lastQuery: null
    },
};
