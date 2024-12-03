import { NextPage } from 'next';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import useForm from '@/components/form/useForm';
import { cls } from '@/libs/utils';
import { api, setContext } from '@/libs/axios';

interface Props {
    counsel_data?: any;
    getData?: any;
}
export default function AuthMethod({ counsel_data, getData }: Props) {
    const router = useRouter();
    let { redirect } = router.query;

    const { s, fn, attrs } = useForm({
        initialValues: {
            login_id: '',
            email: '',
            mobile: '',
            auth_num: '',
        },
        onSubmit: async () => {
            await confirmData();
        },
    });

    const [method, setMethod] = useState('email');
    const methodClick = (m: string) => {
        s.setValues({
            email: '',
            mobile: '',
            login_id: '',
        });

        if (Object.keys(s.errors).length > 0) {
            s.setErrors({});
        }

        setMethod(m);
    };

    const confirmData = async () => {
        try {
            let value: string = 'email';
            if (method == 'email') {
                value = s.values.email;
                if (s.values.email != counsel_data.response.staff_email) {
                    alert('등록된 이메일과 일치하지 않습니다. 이메일 주소를 확인해주세요');
                    return;
                }
            } else {
                value = s.values.mobile;
                if (s.values.mobile != counsel_data.response.staff_mobile) {
                    alert('등록된 연락처와 일치하지 않습니다. 연락처를 확인해주세요');
                    return;
                }
            }
            const { data } = await api.post(`/scm/dream/build/auth/send`, { send_type: method, value, login_id: s.values.login_id });
            // const res = { uid: 6, auth_num: 792674 };
            s.setSubmitting(false);

            if (data.code !== 200) {
                alert(data.msg);
                return;
            }

            getData(s.values, data);
            // goAuthNumInput();
        } catch (e: any) {}
    };

    return (
        <>
            <form onSubmit={fn.handleSubmit} noValidate className="flex flex-col mt-4 space-y-4">
                <div className="md:w-1/2 mx-auto">
                    <div className="flex flex-col items-center">
                        {method == 'email' ? (
                            <div className="border p-1">
                                <img src="/images/auth_email.png" />
                            </div>
                        ) : (
                            <div className="border p-1">
                                <img src="/images/auth_mobile.png" />
                            </div>
                        )}
                        <div className="grid  border-b  w-full mt-8 grid-cols-2 ">
                            <button
                                className={cls(
                                    'py-4 font-medium border-b-2',
                                    method === 'email' ? ' border-cyan-500 text-cyan-400 font-bold' : 'border-transparent hover:text-gray-400 text-gray-500'
                                )}
                                onClick={() => methodClick('email')}
                                type="button"
                            >
                                이메일 인증
                            </button>
                            <button
                                className={cls(
                                    'py-4 font-medium border-b-2',
                                    method === 'mobile' ? ' border-cyan-500 text-cyan-400 font-bold' : 'border-transparent hover:text-gray-400 text-gray-500'
                                )}
                                onClick={() => methodClick('mobile')}
                                type="button"
                            >
                                문자 인증
                            </button>
                        </div>
                    </div>
                    {method === 'email' ? (
                        <>
                            <div className="py-10 text-lg mt-5 text-center">
                                상담신청 당시 등록한
                                <br />
                                담당자 정보를 입력해 주세요.
                                <br />
                                이메일 인증 후 이용가능합니다.
                            </div>
                            <input
                                id="email"
                                name="email"
                                onChange={fn.handleChange}
                                value={s.values.email || ''}
                                type="text"
                                {...attrs.is_email}
                                {...attrs.is_mand}
                                className="form-control"
                                placeholder="이메일을 입력해주세요"
                            ></input>
                            {s.errors['email'] && <div className="form-error text-red-500 text-sm !mt-2">{s.errors['email']}</div>}
                        </>
                    ) : method === 'mobile' ? (
                        <>
                            <div className="py-10 text-lg mt-5 text-center">
                                상담신청 당시 등록한
                                <br />
                                담당자 정보를 입력해 주세요.
                                <br />
                                휴대전화번호 문자 인증 후 이용가능합니다.
                            </div>
                            <input
                                id="mobile"
                                name="mobile"
                                onChange={fn.handleChange}
                                value={s.values.mobile || ''}
                                type="text"
                                {...attrs.is_mobile}
                                {...attrs.is_mand}
                                className={cls('form-control')}
                                placeholder="전화번호를 입력하세요"
                            />
                            {s.errors['mobile'] && <div className="form-error text-red-500 text-sm !mt-2">{s.errors['mobile']}</div>}
                        </>
                    ) : null}
                    <button
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white mt-5 px-4 border border-transparent rounded-md shadow-sm font-medium focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:outline-none h-11"
                        disabled={s.submitting}
                    >
                        인증번호 받기
                    </button>
                </div>
            </form>
        </>
    );
}
