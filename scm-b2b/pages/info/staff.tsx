import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { checkNumeric, cls, getToken } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Layout from '@/components/Layout';

import { EditForm, EditFormTable, EditFormTH, EditFormTD, EditFormSubmit, EditFormInput, EditFormLabel } from '@/components/UIcomponent/form/EditFormA';
import EditFormCallout from '@/components/UIcomponent/form/EditFormCallout';

const InfoStaff: NextPage = (props: any) => {
    const nav_id = 13;
    const crumbs = ['환경설정', '계정관리'];
    const title_sub = '로그인 계정의 정보를 변경할 수 있습니다.';
    const callout = [];
    const router = useRouter();

    const [posts, setPosts] = useState<any>({});
    const [filter, setFilter] = useState<any>({});

    useEffect(() => {
        if (props) {
            if (props.response.code == 200) {
                setPosts(props.response);
                setFilter(props.response.filter);
                s.setValues(props.response.values);
            } else {
                alert(props.response.msg);
                // router.back();
            }
        }
    }, []);

    const { s, fn, attrs } = useForm({
        onSubmit: async () => {
            await editing('REG');
        },
    });

    const deleting = () => editing('DEL');

    const editing = async mode => {
        try {
            if (mode == 'REG' && s.values.uid > 0) {
                mode = 'MOD';
            }
            s.values.mode = mode;
            const { data } = await api.post(`/scm/b2b/center/info/staff/edit`, s.values);
            if (data.code == 200) {
                if (s.values.mode == 'REG') {
                    alert(data.msg);
                    router.replace(`/info/staff`);
                } else {
                    alert(data.msg);
                    if (mode == 'MOD') {
                        router.replace(`/info/staff`);
                    }
                }
            } else {
                alert(data.msg);
            }
            return;
        } catch (e: any) {}
    };

    const handleChangeAlarm = (e: React.ChangeEvent<HTMLInputElement>) => {
        const params = {
            target: e.target.name,
            checked: e.target.checked,
        };

        const copy = { ...s.values };
        let confirm_msg = '';
        if (params.checked == true) {
            if (params.target == 'alarm_kakao') {
                if (s.values.mobile == '') {
                    alert('휴대번호를 작성하세요.');
                    return;
                }
                confirm_msg = '알림톡 수신등록 수락 합니다\n';
                confirm_msg = confirm_msg + '수신 휴대전화번호 : ' + s.values.mobile + '\n';
                confirm_msg = confirm_msg + '발주 및 공지,문의에 대한 알림을 수신하게 됩니다. 계속하시겠습니까 ?';
            } else if (params.target == 'alarm_email') {
                if (s.values.email == '') {
                    alert('이메일을 작성하세요.');
                    return;
                }
                confirm_msg = '이메일 수신등록 수락 합니다\n';
                confirm_msg = confirm_msg + '수신 이메일주소 : ' + s.values.email + '\n';
                confirm_msg = confirm_msg + '발주 및 공지,문의에 대한 알림을 수신하게 됩니다. 계속하시겠습니까 ?';
            }
            copy[params.target] = 'T';
        } else {
            if (params.target == 'alarm_kakao') {
                confirm_msg = '알림톡 수신등록 거절 합니다\n';
                confirm_msg = confirm_msg + '발주 및 공지,문의에 대한 알림을 받을 수 없게 됩니다. 계속하시겠습니까 ?';
            } else if (params.target == 'alarm_email') {
                confirm_msg = '이메일 수신등록 거절 합니다\n';
                confirm_msg = confirm_msg + '발주 및 공지,문의에 대한 알림을 받을 수 없게 됩니다. 계속하시겠습니까 ?';
            }
            copy[params.target] = 'F';
        }
        alert(confirm_msg);
        s.setValues(copy);
    };

    return (
        <Layout nav_id={nav_id} crumbs={crumbs} title={crumbs[crumbs.length - 1]} user={props.user}>
            <EditFormCallout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />
            <EditForm onSubmit={fn.handleSubmit} className="w-2/3">
                <EditFormTable className="grid-cols-6">
                    <EditFormTH className="col-span-1">로그인 ID</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormLabel className="">{posts?.login_id}</EditFormLabel>
                    </EditFormTD>
                    <EditFormTH className="col-span-1 mand">이름</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormInput type="text" name="name" value={s.values?.name || ''} onChange={fn.handleChange} errors={s.errors} className="" is_mand={true} />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">비밀번호</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormInput
                            type="password"
                            name="login_pw"
                            value={s.values?.login_pw || ''}
                            placeholder="변경 시에 만 입력"
                            onChange={fn.handleChange}
                            errors={s.errors}
                            className=""
                        />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">부서</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormInput type="text" name="depart" value={s.values?.depart || ''} onChange={fn.handleChange} errors={s.errors} className="" />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">직급/직책</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormInput type="text" name="position" value={s.values?.position || ''} onChange={fn.handleChange} errors={s.errors} className="" />
                    </EditFormTD>
                    <EditFormTH className="col-span-1">일반전화번호</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormInput type="text" name="tel" value={s.values?.tel || ''} onChange={fn.handleChange} errors={s.errors} className="" />
                    </EditFormTD>
                    <EditFormTH className="col-span-1 mand">핸드폰번호</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <div className="flex gap-4 w-full">
                            <EditFormInput type="text" name="mobile" value={s.values?.mobile || ''} is_mand={true} is_mobile={true} onChange={fn.handleChange} errors={s.errors} />
                            <div className="flex justify-between items-center">
                                <div className="me-3">알림톡 수신</div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="alarm_kakao"
                                        className="sr-only peer"
                                        onChange={handleChangeAlarm}
                                        checked={s.values?.alarm_kakao == 'T' ? true : false}
                                    />
                                    <div className="w-10 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </EditFormTD>
                    <EditFormTH className="col-span-1 mand">이메일</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <div className="flex gap-4 w-full">
                            <EditFormInput type="text" name="email" value={s.values?.email || ''} onChange={fn.handleChange} is_mand={true} errors={s.errors} is_email={true} />
                            <div className="flex justify-between items-center">
                                <div className="me-3">이메일 수신</div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="alarm_email"
                                        className="sr-only peer"
                                        onChange={handleChangeAlarm}
                                        checked={s.values?.alarm_email == 'T' ? true : false}
                                    />
                                    <div className="w-10 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </EditFormTD>
                    <EditFormTH className="col-span-1 mand">역할</EditFormTH>
                    <EditFormTD className="col-span-5">
                        <EditFormLabel className="">{posts?.roles_txt}</EditFormLabel>
                    </EditFormTD>
                </EditFormTable>
                <EditFormSubmit button_name={`${s.values?.uid > 0 ? '수정' : '등록'}하기`} submitting={s.submitting}></EditFormSubmit>
            </EditForm>
        </Layout>
    );
};
export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    var request: any = {};
    var response: any = {};
    try {
        const { data } = await api.post(`/scm/b2b/center/info/staff/read`, request);
        response = data;
    } catch (e: any) {
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }
    return {
        props: { request, response },
    };
};

export default InfoStaff;
