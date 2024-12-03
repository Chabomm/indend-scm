import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { cls, checkNumeric } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Layout from '@/components/Layout';
import Seo from '@/components/Seo';
import DaumPost from '@/components/DaumPost';

const BuildPage: NextPage = (props: any) => {
    const router = useRouter();
    const [daumModal, setDaumModal] = useState(false);
    const [ComItemList, setComItemList] = useState<any>([]);
    // const [basicInfo, setBasicInfo] = useState({
    //     com_item_list: [],
    //     terms_01: '',
    // });

    useEffect(() => {
        if (props) {
            if (props.response.code != 200) {
                alert(props.response.msg);
                close();
            } else {
                s.setValues(props.response.values);
                setComItemList(props.response.com_item_list);
            }
            // props.response.code != 200 => alert(props.response.msg) 그다음 히스토리 빽 history.back();
        }
    }, [props]);

    const { s, fn, attrs } = useForm({
        initialValues: {},
        onSubmit: async () => {
            await editing();
        },
    });

    // 도메인(input) 변경 되면
    const handleBlur = async () => {
        const copy = { ...s.values };
        if (copy.host == '' || s.values.host != copy.adminid_check_value) {
            copy.adminid_check_value = '';
            copy.is_adminid_checked = false;
            s.setValues(copy);
        }
    };

    const adminIdCheck = async () => {
        try {
            const copy = { ...s.values };

            const item = {
                adminid_input_value: copy.host, // 체크할 값
                adminid_check_value: '', // 이전에 체크한 값
                is_adminid_checked: false, // 이전에 체크 했는지
            };

            copy.adminid_input_value = item.adminid_input_value;
            copy.adminid_check_value = item.adminid_check_value;
            copy.is_adminid_checked = item.is_adminid_checked;

            if (item.adminid_input_value.length < 4 || item.adminid_input_value.length > 20) {
                alert('관리자 아이디는 영문 혹은 숫자 4자~20자리로 해주세요.');
                copy.is_adminid_checked = false;
                return;
            }
            const { data } = await api.post(`/scm/dream/build/check`, item);
            // s.setSubmitting(false);
            copy.is_adminid_checked = data;
            if (data.code == 200) {
                if (data.check_result) {
                    alert('사용가능한 아이디입니다.');
                    copy.adminid_check_value = item.adminid_input_value;
                    s.setValues(copy);
                } else {
                    alert('이미 사용중인 아이디입니다.');
                    copy.adminid_check_value = '';
                    s.setValues(copy);
                }
            } else {
                alert(data.msg);
                return;
            }

            console.log(data);
            return;

            console.log('datadatadata', data);
            if (data) {
                alert('사용가능한 아이디입니다.');
                copy.adminid_check_value = item.adminid_input_value;
                s.setValues(copy);
            } else {
                alert('이미 사용중인 아이디입니다.');
                copy.adminid_check_value = '';
                s.setValues(copy);
            }
        } catch (e: any) {}
    };

    // 주소 모달에서 선택 후
    const handleCompleteFormSet = (data: any) => {
        s.values.post = data.zonecode;
        s.values.addr = data.roadAddress;
        const el = document.querySelector("input[name='addr_detail']");
        (el as HTMLElement)?.focus();
    };

    const editing = async () => {
        try {
            const params = { ...s.values };

            if (!params.is_adminid_checked) {
                alert('대표 관리자 아이디 중복검사를 수행해 주세요');
                const el = document.querySelector("input[name='host']");
                (el as HTMLElement)?.focus();
                return;
            }

            params.counsel_uid = router.query.uid;

            const confirmMsg = '※ 복지몰의 도메인은\nhttps://' + params.host + '.welfaredream.com으로 개설됩니다. 계속하시겠습니까?';

            if (!confirm(confirmMsg)) {
                return;
            }
            const { data } = await api.post(`/scm/dream/build/edit`, params);
            if (data.code == '200' && data.msg != '') {
                alert(data.msg + ' 기재하신 연락처로 2~3일 이내 연락을 드립니다.');
                router.reload();
            } else {
                alert(data.msg);
                router.reload();
            }
        } catch (e: any) {}
    };

    return (
        <Layout>
            <Seo title="복지드림" />
            <section style={{ backgroundColor: '#f5f9fc', paddingTop: '80px' }}>
                <div className="md:w-3/4 mx-auto py-5 px-4">
                    {process.env.NODE_ENV == 'development' && (
                        <pre className="">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="font-bold mb-3 text-red-500">s.values</div>
                                    {JSON.stringify(s.values, null, 4)}
                                </div>
                            </div>
                        </pre>
                    )}
                    <div className="text-center">
                        <div>
                            <div className="font-bold text-3xl mb-5">복지드림 구축 절차</div>
                            <div>
                                복지드림을 통해 복지몰 구축을 희망하시나요?
                                <br /> 아래의 양식을 작성하여 문의해 주세요.
                                <br /> 기재하신 연락처로 2~3일 이내 연락을 드립니다.
                            </div>
                        </div>

                        <div className="p-11 mb-3">
                            <div className="border-4 py-1 px-3 text-xl font-bold rounded-full bg-white inline-block border-amber-500">복지몰구축 1668-1317</div>
                        </div>

                        <div className="p-5 bg-white shadow-md rounded-lg">
                            <div className="grid gap-5 grid-cols-3 md:gap-0 md:grid-cols-6">
                                <div className="">
                                    <img src="/images/process02-1.png" className="inline-block" />
                                    <div className="text-sm">구축상담</div>
                                </div>
                                <div>
                                    <img src="/images/process02-2.png" className="inline-block" />
                                    <div className="text-sm text-amber-600">구축 결정</div>
                                </div>
                                <div>
                                    <img src="/images/process02-3.png" className="inline-block" />
                                    <div className="text-sm">계약서 작성</div>
                                </div>
                                <div>
                                    <img src="/images/process02-4.png" className="inline-block" />
                                    <div className="text-sm">개발/디자인</div>
                                </div>
                                <div>
                                    <img src="/images/process02-5.png" className="inline-block" />
                                    <div className="text-sm">회원등록</div>
                                </div>
                                <div>
                                    <img src="/images/process02-6.png" className="inline-block" />
                                    <div className="text-sm">오픈</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="py-11">
                        <form onSubmit={fn.handleSubmit}>
                            <div className="must py-2 text-sm text-gray-500 mb-3">해당 아이콘 표시되어 있는 항목은 필수 입력 항목입니다.</div>
                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="text-lg mb-4 text-slate-600">기본정보</div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    <div className="col-span-1">
                                        <label className="must form-label">회사명</label>
                                        <input
                                            type="text"
                                            name="company_name"
                                            {...attrs.is_mand}
                                            value={s.values?.company_name || ''}
                                            placeholder="회사명을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['company_name'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['company_name'] && <div className="form-error">{s.errors['company_name']}</div>}
                                    </div>
                                    <div className="col-span-1 ">
                                        <label className="must form-label">대표자 이름</label>
                                        <input
                                            type="text"
                                            name="ceo_name"
                                            {...attrs.is_mand}
                                            value={s.values?.ceo_name || ''}
                                            placeholder="대표자명을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['ceo_name'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['ceo_name'] && <div className="form-error">{s.errors['ceo_name']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">회사 대표번호</label>
                                        <input
                                            type="text"
                                            name="company_hp"
                                            {...attrs.is_mobile}
                                            value={s.values?.company_hp || ''}
                                            placeholder="하이픈(-)을 포함하여 입력해주세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['company_hp'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1 ">
                                        <label className="must form-label">사업자등록번호</label>
                                        <input
                                            type="text"
                                            name="biz_no"
                                            {...attrs.is_mand}
                                            {...attrs.is_bizno}
                                            value={s.values?.biz_no || ''}
                                            placeholder="ex) 000-00-00000"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['biz_no'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['biz_no'] && <div className="form-error">{s.errors['biz_no']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">사업자 분류</label>
                                        <div className="flex items-center h-10">
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    {...attrs.is_mand}
                                                    id="biz_kind_100"
                                                    checked={s.values.biz_kind == '100' ? true : false}
                                                    type="radio"
                                                    name="biz_kind"
                                                    value="100"
                                                    className="w-4 h-4"
                                                    onChange={fn.handleChange}
                                                />
                                                <label htmlFor="biz_kind_100" className=" text-sm font-medium">
                                                    법인사업자
                                                </label>
                                                <input
                                                    {...attrs.is_mand}
                                                    id="biz_kind_200"
                                                    checked={s.values.biz_kind == '200' ? true : false}
                                                    type="radio"
                                                    name="biz_kind"
                                                    value="200"
                                                    className="w-4 h-4"
                                                    onChange={fn.handleChange}
                                                />
                                                <label htmlFor="biz_kind_200" className=" text-sm font-medium">
                                                    일반(개인)사업자
                                                </label>
                                                <input
                                                    {...attrs.is_mand}
                                                    id="biz_kind_300"
                                                    checked={s.values.biz_kind == '300' ? true : false}
                                                    type="radio"
                                                    name="biz_kind"
                                                    value="300"
                                                    className="w-4 h-4"
                                                    onChange={fn.handleChange}
                                                />
                                                <label htmlFor="biz_kind_300" className=" text-sm font-medium">
                                                    기타
                                                </label>
                                                {s.errors['biz_kind'] && <div className="form-error">{s.errors['biz_kind']}</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">업종</label>
                                        <select
                                            name="biz_item"
                                            value={s.values?.biz_item || ''}
                                            {...attrs.is_mand}
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['biz_item'] ? 'border-danger' : '', 'form-select')}
                                        >
                                            <option value="">업종을 선택하세요</option>
                                            {ComItemList?.map((v: any, i: number) => (
                                                <option key={i} value={v.sub_code}>
                                                    {v.sub_code_name}
                                                </option>
                                            ))}
                                        </select>
                                        {s.errors['biz_item'] && <div className="form-error">{s.errors['biz_item']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">회사주소</label>
                                        <div className="flex ">
                                            <button
                                                className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600 r"
                                                type="button"
                                                onClick={() => {
                                                    setDaumModal(true);
                                                }}
                                            >
                                                <i className="fas fa-search"></i>
                                            </button>
                                            <input name="post" type="hidden" value={s.values?.post || ''} onChange={fn.handleChange} readOnly />
                                            <input
                                                type="text"
                                                name="addr"
                                                value={s.values?.addr || ''}
                                                onChange={fn.handleChange}
                                                onClick={() => {
                                                    setDaumModal(true);
                                                }}
                                                {...attrs.is_mand}
                                                className={cls(s.errors['addr'] ? 'border-danger' : '', 'form-control !rounded-none !rounded-r-md cursor-pointer')}
                                                placeholder="지번,도로명,건물명으로 검색"
                                                readOnly
                                            />
                                        </div>
                                        {s.errors['addr'] && <div className="form-error">{s.errors['addr']}</div>}
                                    </div>

                                    <div className="col-span-1 ">
                                        <label className="must form-label">상세주소</label>
                                        <input
                                            type="text"
                                            name="addr_detail"
                                            {...attrs.is_mand}
                                            value={s.values?.addr_detail || ''}
                                            placeholder="상세위치 입력 (예:○○빌딩 2층)"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['addr_detail'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['addr_detail'] && <div className="form-error">{s.errors['addr_detail']}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="mb-4">
                                    <span className="text-lg pr-4 text-slate-600">담당자 정보</span>
                                </div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    <div className="col-span-1">
                                        <label className="must form-label">담당자 이름</label>
                                        <input
                                            type="text"
                                            name="staff_name"
                                            {...attrs.is_mand}
                                            value={s.values?.staff_name || ''}
                                            placeholder="담당자 이름을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_name'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['staff_name'] && <div className="form-error">{s.errors['staff_name']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">담당자 부서</label>
                                        <input
                                            type="text"
                                            name="staff_dept"
                                            value={s.values?.staff_dept || ''}
                                            placeholder="담당자 부서 및 직책을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_dept'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">담당자 직급</label>
                                        <input
                                            type="text"
                                            name="staff_position"
                                            value={s.values?.staff_position || ''}
                                            placeholder="담당자 부서 및 직책을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_position'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">담당자 직책</label>
                                        <input
                                            type="text"
                                            name="staff_position2"
                                            value={s.values?.staff_position2 || ''}
                                            placeholder="담당자 부서 및 직책을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_position2'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">담당자 휴대전화번호</label>
                                        <input
                                            type="text"
                                            name="staff_mobile"
                                            {...attrs.is_mand}
                                            {...attrs.is_mobile}
                                            value={s.values?.staff_mobile || ''}
                                            placeholder="ex) 010-0000-0000"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_mobile'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['staff_mobile'] && <div className="form-error">{s.errors['staff_mobile']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">담당자 이메일주소</label>
                                        <input
                                            type="text"
                                            name="staff_email"
                                            {...attrs.is_mand}
                                            {...attrs.is_email}
                                            value={s.values?.staff_email || ''}
                                            placeholder="ex) example@domain.com"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_email'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['staff_email'] && <div className="form-error">{s.errors['staff_email']}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="mb-4">
                                    <span className="text-lg pr-4 text-slate-600">복지몰 구축정보</span>
                                </div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    <div className="col-span-1">
                                        <label className="must form-label">복지몰명</label>
                                        <input
                                            type="text"
                                            name="mall_name"
                                            {...attrs.is_mand}
                                            value={s.values?.mall_name || ''}
                                            placeholder="복지몰명을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['mall_name'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['mall_name'] && <div className="form-error">{s.errors['mall_name']}</div>}
                                    </div>

                                    <div className="col-span-1">
                                        <label className="must form-label">복지몰 도메인</label>
                                        <div className="flex mb-2">
                                            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                                                https://
                                            </span>
                                            <input
                                                type="text"
                                                name="host"
                                                value={s.values?.host || ''}
                                                onChange={fn.handleChange}
                                                {...attrs.is_mand}
                                                className={cls(s.errors['host'] ? 'border-danger' : '', 'form-control !rounded-none !rounded-x-md')}
                                                placeholder="대표관리자아이디"
                                                onBlur={() => handleBlur()}
                                            />
                                            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md">
                                                .welfaredream.com
                                            </span>
                                        </div>
                                        {s.errors['host'] && <div className="form-error">{s.errors['host']}</div>}

                                        {s.values.adminid_check_value ? (
                                            <div className="p-2" style={{ backgroundColor: '#f5f9fc' }}>
                                                <div className="text-red-400">{s.values.adminid_check_value}.welfaredream.com</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        adminIdCheck();
                                                    }}
                                                    className="rounded-md border border-gray-400 text-gray-500 py-2 w-full"
                                                >
                                                    중복확인
                                                </button>
                                                <div className="text-sm text-slate-500 p-2" style={{ backgroundColor: '#f5f9fc' }}>
                                                    관리자아이디 중복확인을 해주세요
                                                </div>
                                            </div>
                                        )}
                                        <div className="text-red-400 text-sm">
                                            ※ 대표 관리자 아이디가 복지몰 도메인으로 사용되오니 반드시 확인 바랍니다. (Tip.회사 영문명 또는 약자 추천)
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">대표 관리자 아이디</label>
                                        {s.values.adminid_check_value ? (
                                            <>
                                                {s.values.is_adminid_checked && (
                                                    <div className="text-lime-500 text-sm">{s.values.adminid_check_value}은(는) 사용가능한 아이디입니다.</div>
                                                )}
                                            </>
                                        ) : (
                                            <>{!s.values.is_adminid_checked && <div className="text-red-400 text-sm">관리자아이디 중복확인을 해주세요</div>}</>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">대표 관리자 비밀번호</label>
                                        <div className="p-2 text-sm text-slate-500" style={{ backgroundColor: '#f5f9fc' }}>
                                            초기 비밀번호는 <br />
                                            관리자 아이디 + 담당자 휴대번호 뒤 4자리 입니다.
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">정산 이메일</label>
                                        <input
                                            type="text"
                                            name="account_email"
                                            {...attrs.is_mand}
                                            {...attrs.is_email}
                                            value={s.values?.account_email || ''}
                                            placeholder="ex) tax@domain.com"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['account_email'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['account_email'] && <div className="form-error">{s.errors['account_email']}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="mb-4">
                                    <span className="text-lg pr-4 text-slate-600">필수 제출서류</span>
                                </div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    <div className="col-span-1">
                                        <label className="must form-label" htmlFor="file">
                                            사업자등록증
                                        </label>
                                        <input
                                            name="file_biz_no-file"
                                            type="file"
                                            className={cls(s.errors['file_biz_no'] ? 'border-danger' : '', 'form-control')}
                                            onChange={e => {
                                                fn.handleFileUpload(e, { upload_path: '/dream/build/', file_type: 'all' });
                                            }}
                                        />
                                        <input {...attrs.is_mand} name="file_biz_no" type="hidden" readOnly />
                                        <div className="form_control_padding_se bg-light p-2 text-sm text-slate-500" style={{ backgroundColor: '#f5f9fc' }}>
                                            {s.values.file_biz_no_fakename ? (
                                                <div className="text-red-400">업로드 파일명 : {s.values.file_biz_no_fakename}</div>
                                            ) : (
                                                <div>사업자등록증을 첨부해 주세요</div>
                                            )}
                                            <div className="text-muted">지원파일 : jpg,png,pdf (최대10MB)</div>
                                        </div>
                                        {s.errors['file_biz_no'] && <div className="form-error">{s.errors['file_biz_no']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label" htmlFor="file">
                                            회사 로고 파일
                                        </label>
                                        <input
                                            name="file_logo-file"
                                            type="file"
                                            className={cls(s.errors['file_logo'] ? 'border-danger' : '', 'form-control')}
                                            onChange={e => {
                                                fn.handleFileUpload(e, { upload_path: '/dream/build/', file_type: 'img' });
                                            }}
                                            accept="image/*"
                                        />
                                        <input {...attrs.is_mand} name="file_logo" type="hidden" readOnly />
                                        <div className="form_control_padding_se bg-light p-2 text-sm text-slate-500" style={{ backgroundColor: '#f5f9fc' }}>
                                            {s.values.file_logo_fakename ? (
                                                <div className="text-red-400">업로드 파일명 : {s.values.file_logo_fakename}</div>
                                            ) : (
                                                <div>회사 로고 파일을 첨부해 주세요</div>
                                            )}
                                            <div className="text-muted">이미지 가이드 : 245*102px, 투명 배경, png (최대 10MB)</div>
                                        </div>
                                        {s.errors['file_logo'] && <div className="form-error">{s.errors['file_logo']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label" htmlFor="file">
                                            통장사본
                                        </label>
                                        <input
                                            name="file_bank-file"
                                            type="file"
                                            className={cls(s.errors['file_bank'] ? 'border-danger' : '', 'form-control')}
                                            onChange={e => {
                                                fn.handleFileUpload(e, { upload_path: '/dream/build/', file_type: 'all' });
                                            }}
                                        />
                                        <input {...attrs.is_mand} name="file_bank" type="hidden" readOnly />
                                        <div className="form_control_padding_se bg-light p-2 text-sm text-slate-500" style={{ backgroundColor: '#f5f9fc' }}>
                                            {s.values.file_bank_fakename ? (
                                                <div className="text-red-400">업로드 파일명 : {s.values.file_bank_fakename}</div>
                                            ) : (
                                                <div>통장사본을 첨부해 주세요</div>
                                            )}
                                            <div className="text-muted">지원파일 : jpg,png,pdf (최대10MB)</div>
                                        </div>
                                        {s.errors['file_bank'] && <div className="form-error">{s.errors['file_bank']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label" htmlFor="file">
                                            복지몰 로고 파일
                                        </label>
                                        <input
                                            name="file_mall_logo-file"
                                            type="file"
                                            className={cls(s.errors['file_mall_logo'] ? 'border-danger' : '', 'form-control')}
                                            onChange={e => {
                                                fn.handleFileUpload(e, { upload_path: '/dream/build/', file_type: 'img' });
                                            }}
                                            accept="image/*"
                                        />
                                        <input {...attrs.is_mand} name="file_mall_logo" type="hidden" readOnly />
                                        <div className="form_control_padding_se bg-light p-2 text-sm text-slate-500" style={{ backgroundColor: '#f5f9fc' }}>
                                            {s.values.file_mall_logo_fakename ? (
                                                <div className="text-red-400">업로드 파일명 : {s.values.file_mall_logo_fakename}</div>
                                            ) : (
                                                <div>복지몰 로고 파일을 첨부해 주세요</div>
                                            )}
                                            <div className="text-muted">이미지 가이드 : 245*102px, 투명 배경, png (최대 10MB)</div>
                                        </div>
                                        {s.errors['file_mall_logo'] && <div className="form-error">{s.errors['file_mall_logo']}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="text-lg mb-4 text-slate-600">
                                    <input
                                        className={cls(s.errors['is_terms'] ? 'border-danger' : '', 'mr-2')}
                                        onChange={fn.handleChange}
                                        name="is_terms"
                                        id="is_terms"
                                        {...attrs.is_mand}
                                        {...attrs.is_single_check}
                                        checked={s.values?.is_terms || ''}
                                        type="checkbox"
                                    />
                                    <label className="font-medium" htmlFor="is_terms">
                                        복지드림 약관동의 (필수)
                                    </label>
                                    {s.errors?.is_terms && <p className="text-red-500 text-xs italic">{s.errors?.is_terms}</p>}
                                </div>

                                <div
                                    className="w-full overflow-y-auto h-52 overflow-x-hidden p-3"
                                    style={{ backgroundColor: '#f5f9fc' }}
                                    dangerouslySetInnerHTML={{ __html: props.response.terms }}
                                ></div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className={cls('py-4', s.values.state == '100' ? '' : 'col-span-3')}>
                                    <button className="rounded-md border w-full border-black py-2" disabled={s.submitting}>
                                        창닫기
                                    </button>
                                </div>
                                {s.values.state == '100' && (
                                    <div className="py-4 col-span-2">
                                        <button className="rounded-md text-white w-full py-2 bg-amber-500" disabled={s.submitting}>
                                            신청하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </section>
            {daumModal && <DaumPost daumModal={daumModal} setDaumModal={setDaumModal} handleCompleteFormSet={handleCompleteFormSet} />}
        </Layout>
    );
};

export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    if (typeof ctx.query.auth_num === 'undefined' || ctx.query.auth_num == '') {
        return {
            redirect: {
                permanent: false,
                destination: '/dream/auth?uid=' + ctx.query.uid,
            },
        };
    } else {
        var request = {
            uid: ctx.query.uid,
            auth_num: ctx.query.auth_num,
        };

        var response: any = {};

        try {
            const { data } = await api.post(`/scm/dream/build/read`, request);
            response = data;
            const terms = await api.get(`/resource/dream/terms/build.html`);
            response.terms = terms.data;
        } catch (e: any) {
            if (typeof e.redirect !== 'undefined') {
                return { redirect: e.redirect };
            }
        }
        if (response.code == '403') {
            return {
                redirect: {
                    permanent: false,
                    destination: '/dream/auth?uid=' + ctx.query.uid,
                },
            };
        } else {
            return {
                props: { request, response },
            };
        }
    }
};

export default BuildPage;
