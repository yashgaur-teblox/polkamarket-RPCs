import * as yup from 'yup';

export const callSchema = yup.object({
  contract: yup
    .mixed()
    .oneOf(['predictionMarket', 'erc20', 'realitio'])
    .required('Contract is required!'),
  method: yup.string().required('Method is required!')
});
