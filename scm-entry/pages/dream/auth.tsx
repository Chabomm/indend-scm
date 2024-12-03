import type { GetServerSideProps, NextPage } from 'next';
import React, { useState } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import AuthMethod from '@/components/login/AuthMethod';
import AuthVaild from '@/components/login/AuthVaild';

const Auth: NextPage = (props: any) => {
    const router = useRouter();
    let { redirect } = router.query;

    const [data, setData] = useState<any>({});
    const [certification, setCertification] = useState<any>([]);
    const [authNum, setAuthNum] = useState(false);

    const getData = (data: any, certification: any) => {
        setCertification(certification);
        setData(data);
        setAuthNum(true);
    };

    const onBack = () => {
        setAuthNum(false);
    };
    console.log('props', props);
    return (
        <div className="mt-16 px-4">
            {authNum ? (
                <div className="flex justify-between">
                    <button onClick={onBack}>
                        <svg className="w-8 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <h3 className="text-3xl font-bold">인증하기</h3>
                    <div className=""></div>
                </div>
            ) : (
                <div></div>
            )}

            <div className="mt-6">
                {!authNum ? <AuthMethod counsel_data={props} getData={getData} /> : <AuthVaild values={data} certification={certification} onBack={onBack} />}
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    // uid 가 0 보다 큰경우
    // 백앤드로 부터 정보를가져와
    // 담당자의 이메일, 폰번호

    var request = {
        uid: ctx.query.uid,
    };

    var response: any = {};
    try {
        const { data } = await api.post(`/scm/dream/build/auth`, request);
        response = data;
    } catch (e: any) {
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }
    if (response.code == '507') {
        return {
            redirect: {
                permanent: false,
                destination: '/fail',
            },
        };
    } else {
        return {
            props: { request, response },
        };
    }
    // return {
    //     props: { request, response },
    // };
};

export default Auth;
