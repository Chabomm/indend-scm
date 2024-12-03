// https://gist.github.com/moogii/f4b3c35b22ca1b20fdcbc0fa770069ca
import { GetServerSidePropsContext } from 'next';
import { getCookie, getServerCookieToken, getToken, getUserIP, left } from './utils';
import axios, { AxiosError } from 'axios';
import Router from 'next/router';

export const inbound = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

const isServer = () => {
    return typeof window === 'undefined';
};

let context = <GetServerSidePropsContext>{};
let post_token = '';
export const setContext = (_context: GetServerSidePropsContext, _post_token: string) => {
    context = _context;
    post_token = _post_token;
};

inbound.interceptors.request.use(config => {
    /** config에는 위의 axiosInstance 객체를 이용하여 request를 보냈을떄의 모든 설정값들이 들어있다.
     * [활용]
     * 1. api요청의 경우 token이 필요한 경우가 있는데, 필요에 따른 토큰 정보들을 여기서 처리할 경우
     * 토큰에 대한 정보를 여러곳에서 처리하지 않아도 된다.
     * 2. 요청 method에 따른 외부로 드러내지 않고 처리하고 싶은 부분에 대한 작업이 가능
     */

    if (isServer()) {
        config.baseURL = `${process.env.NEXT_PUBLIC_BACKEND}`;
        config.headers['x-user-ip'] = `${getUserIP(context)}`;

        if (post_token != '') {
            // postData의 token이 있을때
            config.headers['Authorization'] = `Bearer ${post_token}`;
        } else {
            // 없을때는 쿠키에 있는 INBOUND로
            const token = context.req?.cookies['INBOUND'];
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    } else {
        config.baseURL = ``;
        config.headers['Authorization'] = `Bearer ${getCookie(`INBOUND`)}`;
    }
    return config;
});

inbound.interceptors.response.use(
    response => {
        /** 요청을 보낸 뒤에 response(응답)이 오는 경우에 여기서 먼저 확인이 가능하다.
         * [활용]
         * 1. status-code가 정상적이어도 내용상의 이유로 에러처리가 필요한 경우
         * 2. 민감정보 또는 데이터에 대한 가공 작업
         */
        // console.log('interceptors response', response);

        if (isServer() && !response?.config?.url?.includes('scm/client_error')) {
            try {
                const token = (response.headers['set-cookie'] as string[]).find(cookie => cookie.includes(`INBOUND`))?.match(new RegExp(`^INBOUND=(.+?);`))?.[1];
                context.res?.setHeader('set-cookie', `INBOUND=${token}; path=/;`);
            } catch (e) {}
        }
        return response;
    },
    (error: AxiosError) => {
        /** response응답 후에 status-code가 4xx, 5xx 처럼 에러를 나타내는 경우 해당 루트를 수행한다. */
        return sendErrorLog(error);
    }
);

const sendErrorLog = async (oError: any) => {
    return Promise.reject(oError);
};

export default inbound;
