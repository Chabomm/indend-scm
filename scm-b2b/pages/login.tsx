import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import LottieLogin from '@/components/resource/lottie/Login';
import SvgLeftTop from '@/components/resource/svg/lefttop';
import SvgRightBottom from '@/components/resource/svg/rightbottom';
import useForm from '@/components/form/useForm';
import { api, setContext } from '@/libs/axios';

const Lgoin: NextPage = (props: any) => {
    const router = useRouter();
    let { redirect } = router.query;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const copy = { ...s.values };
            const storage_seller = localStorage.getItem('seller_id');
            if (storage_seller !== null && storage_seller != '') {
                copy.seller_id = storage_seller;
                copy.seller_id_save = 'true';
            }
            const storage_login = localStorage.getItem('login_id');
            if (storage_login !== null && storage_login != '') {
                copy.login_id = storage_login;
                copy.login_id_save = 'true';
            }
            s.setValues(copy);

            if (process.env.NODE_ENV == 'development' && copy.seller_id == '' && copy.login_id == '') {
                copy.seller_id = 'B2B1238';
                copy.login_id = 'uhjung';
                copy.login_pw = '1234';
                s.setValues(copy);
            }
        }
    }, [router, router.isReady]);

    const { s, fn, attrs } = useForm({
        initialValues: {
            seller_id: '',
            seller_id_save: '',
            login_id: '',
            login_id_save: '',
            login_pw: '',
            auto_save: '',
        },
        onSubmit: async () => {
            await signin(s.values);
        },
    });

    const signin = async (p: any) => {
        const copy = { ...s.values };

        // 로그인 상태 유지 auto_save
        // const getData = api.post(`/scm/b2b/center/auth/signin`, copy);
        // const res = (await getData).data;

        const { data } = await api.post(`/scm/b2b/center/auth/signin`, copy);

        if (data.code != 200) {
            alert(data.msg);
            return;
        }

        if (s.values.seller_id_save == 'true') {
            localStorage.setItem('seller_id', p.seller_id);
        } else {
            localStorage.removeItem('seller_id');
        }

        if (s.values.login_id_save == 'true') {
            localStorage.setItem('login_id', p.login_id);
        } else {
            localStorage.removeItem('login_id');
        }

        localStorage.setItem('center_menus', JSON.stringify(data.center_menus));
        localStorage.setItem('partner_info', JSON.stringify(data.partner_info));

        if (typeof redirect === 'undefined' || redirect === '') {
            redirect = '/';
        }

        router.push(redirect + '');
    };

    const attr_is_mand = {
        is_mand: 'true',
    };

    return (
        <div className="h-screen overflow-hidden flex items-center justify-center" style={{ background: '#edf2f7' }}>
            <div className="bg-white relative lg:py-20">
                <div className="flex flex-col items-center justify-between xl:px-5 lg:flex-row">
                    <div className="flex flex-col items-center w-full pt-5 px-5 pb-20 lg:px-10 lg:pt-20 lg:flex-row">
                        <div className="w-full bg-cover relative max-w-md lg:max-w-2xl lg:w-7/12">
                            <div className="flex flex-col items-center justify-center w-full h-full relative lg:pr-10">
                                <LottieLogin />
                            </div>
                        </div>
                        <div className="w-full mt-20 mr-0 mb-0 ml-0 relative z-10 max-w-2xl lg:mt-0 lg:w-5/12">
                            <div className="flex flex-col items-start justify-start p-5 lg:p-10 bg-white shadow-2xl rounded-xl relative z-10">
                                <p className="w-full text-4xl font-medium text-center leading-snug">B2B 판매자센터</p>

                                <form method="post" onSubmit={fn.handleSubmit} noValidate className="w-full mt-6 mr-0 mb-0 ml-0 relative space-y-8">
                                    <div className="relative mb-2">
                                        <p className="bg-white pt-0 pr-2 pb-0 pl-2 -mt-3 mr-0 mb-0 ml-2 font-medium text-gray-600 absolute">판매자아이디</p>
                                        <input
                                            id="seller_id"
                                            name="seller_id"
                                            value={s.values?.seller_id}
                                            onChange={fn.handleChange}
                                            {...attr_is_mand}
                                            placeholder="판매자아이디를 입력해 주세요"
                                            type="text"
                                            className="border placeholder-gray-400 focus:outline-none focus:border-black w-full pt-4 pr-4 pb-4 pl-4 mt-2 mr-0 mb-0 ml-0 text-base block bg-white border-gray-300 rounded-md"
                                        />
                                        {s.errors['seller_id'] && <p className="text-red-500 text-xs italic mb-3 ">{s.errors['seller_id']}</p>}
                                        <div className="mt-2">
                                            <div className="flex items-center">
                                                <label className="relative flex cursor-pointer items-center rounded-full p-1" htmlFor="login" data-ripple-dark="true">
                                                    <input
                                                        id={`seller_id_save`}
                                                        checked={s.values?.seller_id_save == 'true'}
                                                        type="checkbox"
                                                        {...attrs.is_single_check}
                                                        name={`seller_id_save`}
                                                        className="h-4 w-4"
                                                        onChange={fn.handleChange}
                                                    />
                                                </label>
                                                <label htmlFor={`seller_id_save`} className="font-medium">
                                                    판매자 아이디 저장
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative mb-2">
                                        <p className="bg-white pt-0 pr-2 pb-0 pl-2 -mt-3 mr-0 mb-0 ml-2 font-medium text-gray-600 absolute">관리자아이디</p>
                                        <input
                                            id="login_id"
                                            name="login_id"
                                            value={s.values?.login_id}
                                            onChange={fn.handleChange}
                                            {...attr_is_mand}
                                            placeholder="관리자아이디를 입력해 주세요"
                                            type="text"
                                            className="border placeholder-gray-400 focus:outline-none focus:border-black w-full pt-4 pr-4 pb-4 pl-4 mt-2 mr-0 mb-0 ml-0 text-base block bg-white border-gray-300 rounded-md"
                                        />
                                        {s.errors['login_id'] && <p className="text-red-500 text-xs italic mb-3 ">{s.errors['login_id']}</p>}
                                        <div className="mt-2">
                                            <div className="flex items-center">
                                                <label className="relative flex cursor-pointer items-center rounded-full p-1" htmlFor="login" data-ripple-dark="true">
                                                    <input
                                                        id={`login_id_save`}
                                                        checked={s.values?.login_id_save == 'true'}
                                                        type="checkbox"
                                                        {...attrs.is_single_check}
                                                        name={`login_id_save`}
                                                        className="h-4 w-4"
                                                        onChange={fn.handleChange}
                                                    />
                                                </label>
                                                <label htmlFor={`login_id_save`} className="font-medium">
                                                    관리자아이디 저장
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative mb-2">
                                        <p className="bg-white pt-0 pr-2 pb-0 pl-2 -mt-3 mr-0 mb-0 ml-2 font-medium text-gray-600 absolute">Password</p>
                                        <input
                                            id="login_pw"
                                            name="login_pw"
                                            value={s.values?.login_pw}
                                            onChange={fn.handleChange}
                                            {...attr_is_mand}
                                            placeholder="비밀번호를 입력해 주세요"
                                            type="password"
                                            className="border placeholder-gray-400 focus:outline-none focus:border-black w-full pt-4 pr-4 pb-4 pl-4 mt-2 mr-0 mb-0 ml-0 text-base block bg-white border-gray-300 rounded-md"
                                        />
                                        {s.errors['login_pw'] && <p className="text-red-500 text-xs italic mb-3 ">{s.errors['login_pw']}</p>}
                                        <div className="mt-2">
                                            <div className="flex items-center">
                                                <label className="relative flex cursor-pointer items-center rounded-full p-1" htmlFor="login" data-ripple-dark="true">
                                                    <input
                                                        id={`auto_save`}
                                                        checked={s.values?.auto_save == 'true'}
                                                        type="checkbox"
                                                        {...attrs.is_single_check}
                                                        name={`auto_save`}
                                                        className="h-4 w-4"
                                                        onChange={fn.handleChange}
                                                    />
                                                </label>
                                                <label htmlFor={`auto_save`} className="font-medium">
                                                    로그인 상태 유지
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            disabled={s.submitting}
                                            className="w-full inline-block pt-4 pr-5 pb-4 pl-5 text-xl font-medium text-center text-white bg-indigo-500 rounded-lg transition duration-200 hover:bg-indigo-600 ease"
                                        >
                                            로그인
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <SvgLeftTop className="absolute top-0 left-0 z-0 w-32 h-32 -mt-12 -ml-12 text-yellow-300 fill-current" />
                            <SvgRightBottom className="absolute bottom-0 right-0 z-0 w-32 h-32 -mb-12 -mr-12 text-indigo-500 fill-current" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lgoin;
